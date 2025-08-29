"""
Risk Worker - User and cohort risk scoring with adaptive campaign escalation
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import statistics
from dataclasses import dataclass

from shared.database import get_async_session, get_redis_client, get_clickhouse_client
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

@dataclass
class RiskScore:
    user_id: str
    org_id: str
    overall_score: float  # 0-100, higher = more risk
    click_rate: float
    report_rate: float
    training_completion_rate: float
    recent_incidents: int
    risk_level: str  # low, medium, high, critical
    last_updated: datetime
    factors: Dict[str, float]

@dataclass
class CohortRisk:
    cohort_id: str
    org_id: str
    average_risk_score: float
    high_risk_users: int
    total_users: int
    risk_trend: str  # improving, stable, declining
    recommended_actions: List[str]
    last_updated: datetime

class RiskWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Risk scoring weights
        self.risk_weights = {
            'click_rate': 0.35,           # High weight for clicking phishing links
            'report_rate': -0.25,         # Negative weight (reporting reduces risk)
            'training_completion': -0.20, # Negative weight (training reduces risk)
            'recent_incidents': 0.15,     # Recent security incidents
            'time_to_report': 0.10,       # How quickly they report suspicious content
            'repeat_offender': 0.05       # Multiple clicks in short timeframe
        }
        
        # Risk level thresholds
        self.risk_thresholds = {
            'low': 25,
            'medium': 50,
            'high': 75,
            'critical': 90
        }

    async def start(self):
        """Start the risk worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['risk_update'], self.handle_risk_request, 'risk_workers')
        
        # Start periodic risk calculation
        asyncio.create_task(self.periodic_risk_calculation())
        
        logger.info("Risk worker started")

    async def stop(self):
        """Stop the risk worker"""
        self.is_running = False
        logger.info("Risk worker stopped")

    async def handle_risk_request(self, data: Dict[str, Any], msg):
        """Handle risk calculation request"""
        try:
            request_type = data.get('type')
            
            if request_type == 'calculate_user_risk':
                result = await self.calculate_user_risk(data)
            elif request_type == 'calculate_cohort_risk':
                result = await self.calculate_cohort_risk(data)
            elif request_type == 'get_risk_recommendations':
                result = await self.get_risk_recommendations(data)
            elif request_type == 'trigger_adaptive_campaign':
                result = await self.trigger_adaptive_campaign(data)
            else:
                raise ValueError(f"Unknown risk request type: {request_type}")
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond(result)
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling risk request: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def calculate_user_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate risk score for a specific user"""
        user_id = data.get('user_id')
        org_id = data.get('org_id')
        
        if not user_id or not org_id:
            raise ValueError("user_id and org_id are required")
        
        # Get user's historical data
        user_metrics = await self._get_user_metrics(user_id, org_id)
        
        # Calculate individual risk factors
        risk_factors = await self._calculate_risk_factors(user_id, org_id, user_metrics)
        
        # Calculate overall risk score
        overall_score = self._calculate_weighted_risk_score(risk_factors)
        
        # Determine risk level
        risk_level = self._determine_risk_level(overall_score)
        
        # Create risk score object
        risk_score = RiskScore(
            user_id=user_id,
            org_id=org_id,
            overall_score=overall_score,
            click_rate=risk_factors.get('click_rate', 0),
            report_rate=risk_factors.get('report_rate', 0),
            training_completion_rate=risk_factors.get('training_completion', 0),
            recent_incidents=risk_factors.get('recent_incidents', 0),
            risk_level=risk_level,
            last_updated=datetime.utcnow(),
            factors=risk_factors
        )
        
        # Store risk score
        await self._store_user_risk_score(risk_score)
        
        # Check if adaptive action is needed
        if risk_level in ['high', 'critical']:
            await self._trigger_adaptive_actions(risk_score)
        
        return {
            'success': True,
            'user_id': user_id,
            'risk_score': overall_score,
            'risk_level': risk_level,
            'factors': risk_factors,
            'recommendations': self._generate_user_recommendations(risk_score)
        }

    async def calculate_cohort_risk(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate risk metrics for a user cohort"""
        cohort_id = data.get('cohort_id')
        org_id = data.get('org_id')
        user_ids = data.get('user_ids', [])
        
        if not cohort_id or not org_id:
            raise ValueError("cohort_id and org_id are required")
        
        # Calculate risk for all users in cohort
        user_risk_scores = []
        for user_id in user_ids:
            try:
                user_risk = await self.calculate_user_risk({
                    'user_id': user_id,
                    'org_id': org_id
                })
                user_risk_scores.append(user_risk['risk_score'])
            except Exception as e:
                logger.warning(f"Failed to calculate risk for user {user_id}: {e}")
        
        if not user_risk_scores:
            return {
                'success': False,
                'error': 'No valid user risk scores calculated'
            }
        
        # Calculate cohort metrics
        average_risk = statistics.mean(user_risk_scores)
        high_risk_users = len([score for score in user_risk_scores if score >= self.risk_thresholds['high']])
        
        # Determine risk trend
        risk_trend = await self._calculate_risk_trend(cohort_id, org_id, average_risk)
        
        # Generate recommendations
        recommendations = self._generate_cohort_recommendations(
            average_risk, high_risk_users, len(user_ids), risk_trend
        )
        
        # Create cohort risk object
        cohort_risk = CohortRisk(
            cohort_id=cohort_id,
            org_id=org_id,
            average_risk_score=average_risk,
            high_risk_users=high_risk_users,
            total_users=len(user_ids),
            risk_trend=risk_trend,
            recommended_actions=recommendations,
            last_updated=datetime.utcnow()
        )
        
        # Store cohort risk
        await self._store_cohort_risk(cohort_risk)
        
        return {
            'success': True,
            'cohort_id': cohort_id,
            'average_risk_score': average_risk,
            'high_risk_users': high_risk_users,
            'total_users': len(user_ids),
            'risk_trend': risk_trend,
            'recommendations': recommendations
        }

    async def _get_user_metrics(self, user_id: str, org_id: str) -> Dict[str, Any]:
        """Get user's historical security metrics"""
        clickhouse = get_clickhouse_client()
        
        # Query user's event history from ClickHouse
        query = """
        SELECT 
            event_type,
            COUNT(*) as count,
            MIN(timestamp) as first_event,
            MAX(timestamp) as last_event
        FROM ai_defense_events.events 
        WHERE user_id = %(user_id)s 
        AND org_id = %(org_id)s 
        AND timestamp >= %(start_date)s
        GROUP BY event_type
        """
        
        start_date = datetime.utcnow() - timedelta(days=90)  # Last 90 days
        
        try:
            results = clickhouse.execute(query, {
                'user_id': user_id,
                'org_id': org_id,
                'start_date': start_date
            })
            
            metrics = {}
            for row in results:
                event_type, count, first_event, last_event = row
                metrics[event_type] = {
                    'count': count,
                    'first_event': first_event,
                    'last_event': last_event
                }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Failed to get user metrics: {e}")
            return {}

    async def _calculate_risk_factors(self, user_id: str, org_id: str, metrics: Dict[str, Any]) -> Dict[str, float]:
        """Calculate individual risk factors for a user"""
        factors = {}
        
        # Calculate click rate
        total_sent = metrics.get('email_sent', {}).get('count', 0) + \
                    metrics.get('sms_sent', {}).get('count', 0)
        total_clicked = metrics.get('email_clicked', {}).get('count', 0) + \
                      metrics.get('sms_clicked', {}).get('count', 0)
        
        factors['click_rate'] = (total_clicked / total_sent * 100) if total_sent > 0 else 0
        
        # Calculate report rate
        total_reported = metrics.get('email_reported', {}).get('count', 0) + \
                        metrics.get('sms_reported', {}).get('count', 0)
        
        factors['report_rate'] = (total_reported / total_sent * 100) if total_sent > 0 else 0
        
        # Training completion rate
        training_started = metrics.get('training_started', {}).get('count', 0)
        training_completed = metrics.get('training_completed', {}).get('count', 0)
        
        factors['training_completion'] = (training_completed / training_started * 100) if training_started > 0 else 0
        
        # Recent incidents (last 30 days)
        recent_cutoff = datetime.utcnow() - timedelta(days=30)
        recent_incidents = 0
        
        for event_type in ['email_clicked', 'sms_clicked', 'landing_form_submitted']:
            if event_type in metrics:
                last_event = metrics[event_type].get('last_event')
                if last_event and last_event >= recent_cutoff:
                    recent_incidents += metrics[event_type]['count']
        
        factors['recent_incidents'] = recent_incidents
        
        # Time to report (average time between click and report)
        factors['time_to_report'] = await self._calculate_time_to_report(user_id, org_id)
        
        # Repeat offender factor
        factors['repeat_offender'] = await self._calculate_repeat_offender_score(user_id, org_id, metrics)
        
        return factors

    async def _calculate_time_to_report(self, user_id: str, org_id: str) -> float:
        """Calculate average time between suspicious activity and reporting"""
        # This would analyze the time difference between clicks and reports
        # For now, return a default value
        return 50.0  # Neutral score

    async def _calculate_repeat_offender_score(self, user_id: str, org_id: str, metrics: Dict[str, Any]) -> float:
        """Calculate score based on repeated security incidents"""
        total_incidents = 0
        for event_type in ['email_clicked', 'sms_clicked', 'landing_form_submitted']:
            if event_type in metrics:
                total_incidents += metrics[event_type]['count']
        
        # Score increases with number of incidents
        if total_incidents >= 5:
            return 100.0  # High risk
        elif total_incidents >= 3:
            return 75.0   # Medium-high risk
        elif total_incidents >= 1:
            return 50.0   # Medium risk
        else:
            return 0.0    # Low risk

    def _calculate_weighted_risk_score(self, factors: Dict[str, float]) -> float:
        """Calculate overall weighted risk score"""
        total_score = 0.0
        
        for factor, value in factors.items():
            weight = self.risk_weights.get(factor, 0)
            
            # Normalize values to 0-100 scale if needed
            normalized_value = min(max(value, 0), 100)
            
            total_score += normalized_value * weight
        
        # Ensure score is between 0 and 100
        return min(max(total_score, 0), 100)

    def _determine_risk_level(self, score: float) -> str:
        """Determine risk level based on score"""
        if score >= self.risk_thresholds['critical']:
            return 'critical'
        elif score >= self.risk_thresholds['high']:
            return 'high'
        elif score >= self.risk_thresholds['medium']:
            return 'medium'
        else:
            return 'low'

    async def _store_user_risk_score(self, risk_score: RiskScore):
        """Store user risk score in Redis and database"""
        redis = await get_redis_client()
        
        # Store in Redis for quick access
        risk_data = {
            'user_id': risk_score.user_id,
            'org_id': risk_score.org_id,
            'overall_score': risk_score.overall_score,
            'risk_level': risk_score.risk_level,
            'click_rate': risk_score.click_rate,
            'report_rate': risk_score.report_rate,
            'training_completion_rate': risk_score.training_completion_rate,
            'recent_incidents': risk_score.recent_incidents,
            'last_updated': risk_score.last_updated.isoformat(),
            'factors': risk_score.factors
        }
        
        await redis.setex(
            f"user_risk:{risk_score.user_id}",
            86400,  # 24 hours TTL
            json.dumps(risk_data, default=str)
        )
        
        # Also store in organization-level risk tracking
        await redis.zadd(
            f"org_risk_scores:{risk_score.org_id}",
            {risk_score.user_id: risk_score.overall_score}
        )

    async def _store_cohort_risk(self, cohort_risk: CohortRisk):
        """Store cohort risk assessment"""
        redis = await get_redis_client()
        
        cohort_data = {
            'cohort_id': cohort_risk.cohort_id,
            'org_id': cohort_risk.org_id,
            'average_risk_score': cohort_risk.average_risk_score,
            'high_risk_users': cohort_risk.high_risk_users,
            'total_users': cohort_risk.total_users,
            'risk_trend': cohort_risk.risk_trend,
            'recommended_actions': cohort_risk.recommended_actions,
            'last_updated': cohort_risk.last_updated.isoformat()
        }
        
        await redis.setex(
            f"cohort_risk:{cohort_risk.cohort_id}",
            86400,  # 24 hours TTL
            json.dumps(cohort_data, default=str)
        )

    async def _trigger_adaptive_actions(self, risk_score: RiskScore):
        """Trigger adaptive actions for high-risk users"""
        actions = []
        
        if risk_score.risk_level == 'critical':
            actions = [
                'immediate_additional_training',
                'manager_notification',
                'enhanced_monitoring',
                'mandatory_security_briefing'
            ]
        elif risk_score.risk_level == 'high':
            actions = [
                'additional_training',
                'increased_simulation_frequency',
                'coaching_session'
            ]
        
        for action in actions:
            await self._execute_adaptive_action(risk_score, action)

    async def _execute_adaptive_action(self, risk_score: RiskScore, action: str):
        """Execute specific adaptive action"""
        action_data = {
            'type': 'adaptive_action',
            'action': action,
            'user_id': risk_score.user_id,
            'org_id': risk_score.org_id,
            'risk_score': risk_score.overall_score,
            'risk_level': risk_score.risk_level,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        if action == 'immediate_additional_training':
            # Assign urgent training modules
            await publish_message(TOPICS['coach_send'], {
                'type': 'assign_urgent_training',
                'user_id': risk_score.user_id,
                'training_modules': ['advanced_phishing_detection', 'incident_response'],
                'priority': 'high'
            })
        
        elif action == 'manager_notification':
            # Notify user's manager
            await publish_message('notifications.manager', {
                'type': 'high_risk_user_alert',
                'user_id': risk_score.user_id,
                'risk_level': risk_score.risk_level,
                'recommended_actions': self._generate_manager_recommendations(risk_score)
            })
        
        elif action == 'enhanced_monitoring':
            # Enable enhanced monitoring for this user
            redis = await get_redis_client()
            await redis.setex(
                f"enhanced_monitoring:{risk_score.user_id}",
                604800,  # 7 days
                json.dumps(action_data)
            )
        
        logger.info(f"Executed adaptive action '{action}' for user {risk_score.user_id}")

    def _generate_user_recommendations(self, risk_score: RiskScore) -> List[str]:
        """Generate personalized recommendations for a user"""
        recommendations = []
        
        if risk_score.click_rate > 20:
            recommendations.append("Complete advanced phishing identification training")
        
        if risk_score.report_rate < 10:
            recommendations.append("Learn how to properly report suspicious emails")
        
        if risk_score.training_completion_rate < 80:
            recommendations.append("Complete pending security awareness training")
        
        if risk_score.recent_incidents > 2:
            recommendations.append("Schedule one-on-one security coaching session")
        
        if risk_score.risk_level in ['high', 'critical']:
            recommendations.append("Mandatory security briefing with IT team")
        
        return recommendations

    def _generate_cohort_recommendations(self, avg_risk: float, high_risk_users: int, total_users: int, trend: str) -> List[str]:
        """Generate recommendations for a cohort"""
        recommendations = []
        
        high_risk_percentage = (high_risk_users / total_users) * 100 if total_users > 0 else 0
        
        if high_risk_percentage > 25:
            recommendations.append("Implement organization-wide security awareness campaign")
        
        if avg_risk > 60:
            recommendations.append("Increase phishing simulation frequency")
        
        if trend == 'declining':
            recommendations.append("Review and update security training content")
            recommendations.append("Conduct security culture assessment")
        
        if high_risk_users > 10:
            recommendations.append("Create targeted training program for high-risk users")
        
        return recommendations

    def _generate_manager_recommendations(self, risk_score: RiskScore) -> List[str]:
        """Generate recommendations for managers of high-risk users"""
        return [
            f"User has {risk_score.risk_level} security risk level",
            "Consider additional security training",
            "Monitor for suspicious email activity",
            "Provide coaching on security best practices",
            "Review user's access permissions if necessary"
        ]

    async def _calculate_risk_trend(self, cohort_id: str, org_id: str, current_avg: float) -> str:
        """Calculate risk trend for a cohort"""
        redis = await get_redis_client()
        
        # Get historical risk scores
        historical_key = f"cohort_risk_history:{cohort_id}"
        history = await redis.lrange(historical_key, 0, 4)  # Last 5 data points
        
        if len(history) < 2:
            return 'stable'  # Not enough data
        
        # Calculate trend
        scores = [float(score) for score in history]
        scores.append(current_avg)
        
        # Simple trend calculation
        if len(scores) >= 3:
            recent_trend = scores[-1] - scores[-3]
            if recent_trend < -5:
                return 'improving'
            elif recent_trend > 5:
                return 'declining'
        
        return 'stable'

    async def periodic_risk_calculation(self):
        """Periodically recalculate risk scores for all users"""
        while self.is_running:
            try:
                logger.info("Starting periodic risk calculation")
                
                # Get all active organizations
                # This would query the database for active orgs
                # For now, we'll skip the actual implementation
                
                await asyncio.sleep(3600)  # Run every hour
                
            except Exception as e:
                logger.error(f"Error in periodic risk calculation: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes before retry

    async def get_risk_recommendations(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Get risk-based recommendations for campaigns or training"""
        org_id = data.get('org_id')
        cohort_id = data.get('cohort_id')
        
        # Get cohort risk data
        redis = await get_redis_client()
        cohort_data = await redis.get(f"cohort_risk:{cohort_id}")
        
        if not cohort_data:
            return {
                'success': False,
                'error': 'Cohort risk data not found'
            }
        
        cohort_risk = json.loads(cohort_data)
        
        # Generate adaptive campaign recommendations
        recommendations = {
            'campaign_frequency': self._recommend_campaign_frequency(cohort_risk),
            'difficulty_level': self._recommend_difficulty_level(cohort_risk),
            'target_users': self._recommend_target_users(cohort_risk),
            'training_focus': self._recommend_training_focus(cohort_risk)
        }
        
        return {
            'success': True,
            'recommendations': recommendations,
            'cohort_risk_summary': cohort_risk
        }

    def _recommend_campaign_frequency(self, cohort_risk: Dict[str, Any]) -> str:
        """Recommend campaign frequency based on cohort risk"""
        avg_risk = cohort_risk.get('average_risk_score', 0)
        
        if avg_risk >= 70:
            return 'weekly'
        elif avg_risk >= 50:
            return 'bi-weekly'
        elif avg_risk >= 30:
            return 'monthly'
        else:
            return 'quarterly'

    def _recommend_difficulty_level(self, cohort_risk: Dict[str, Any]) -> str:
        """Recommend campaign difficulty based on cohort performance"""
        avg_risk = cohort_risk.get('average_risk_score', 0)
        
        if avg_risk >= 60:
            return 'beginner'  # Start with easier simulations
        elif avg_risk >= 40:
            return 'intermediate'
        else:
            return 'advanced'

    def _recommend_target_users(self, cohort_risk: Dict[str, Any]) -> List[str]:
        """Recommend which users to target in next campaign"""
        high_risk_users = cohort_risk.get('high_risk_users', 0)
        total_users = cohort_risk.get('total_users', 0)
        
        if high_risk_users > total_users * 0.3:
            return ['high_risk_users_only']
        elif high_risk_users > total_users * 0.1:
            return ['high_risk_users', 'random_sample']
        else:
            return ['all_users']

    def _recommend_training_focus(self, cohort_risk: Dict[str, Any]) -> List[str]:
        """Recommend training focus areas"""
        recommendations = cohort_risk.get('recommended_actions', [])
        
        focus_areas = []
        for rec in recommendations:
            if 'training' in rec.lower():
                if 'phishing' in rec.lower():
                    focus_areas.append('phishing_identification')
                elif 'reporting' in rec.lower():
                    focus_areas.append('incident_reporting')
                else:
                    focus_areas.append('general_security_awareness')
        
        return focus_areas or ['general_security_awareness']

    async def trigger_adaptive_campaign(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger an adaptive campaign based on risk levels"""
        org_id = data.get('org_id')
        trigger_reason = data.get('trigger_reason', 'high_risk_detected')
        
        # Get organization risk summary
        redis = await get_redis_client()
        high_risk_users = await redis.zrevrangebyscore(
            f"org_risk_scores:{org_id}",
            100, 75  # Users with risk score 75-100
        )
        
        if not high_risk_users:
            return {
                'success': False,
                'message': 'No high-risk users found'
            }
        
        # Create adaptive campaign
        campaign_data = {
            'type': 'create_adaptive_campaign',
            'org_id': org_id,
            'target_users': high_risk_users,
            'campaign_type': 'email',  # Start with email
            'difficulty': 'beginner',  # Easier for high-risk users
            'priority': 'high',
            'trigger_reason': trigger_reason,
            'auto_generated': True
        }
        
        # Publish campaign creation request
        await publish_message(TOPICS['campaign_schedule'], campaign_data)
        
        return {
            'success': True,
            'message': f'Adaptive campaign triggered for {len(high_risk_users)} high-risk users',
            'target_users': len(high_risk_users),
            'campaign_type': 'email'
        }
