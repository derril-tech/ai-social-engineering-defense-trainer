"""
Coach Worker - Just-in-time coaching and micro-lesson delivery
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json

from shared.database import get_async_session, get_redis_client
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

class CoachWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Coaching templates by event type
        self.coaching_templates = {
            'email_clicked': {
                'title': 'Email Link Clicked - Learning Opportunity',
                'message': """
🚨 **Training Simulation Alert** 🚨

You just clicked a link in a simulated phishing email. In a real attack, this could have been dangerous!

**What you should have noticed:**
• Urgent language pressuring immediate action
• Generic greeting (not personalized)
• Suspicious sender domain
• Request for sensitive information

**Next time, remember to:**
1. Hover over links before clicking
2. Verify the sender's identity
3. Look for spelling/grammar errors
4. When in doubt, report it!

**Good news:** This was just training, and you're learning! 🎓
                """,
                'micro_lessons': ['phishing_identification', 'link_safety', 'email_verification']
            },
            'sms_clicked': {
                'title': 'SMS Link Clicked - Learning Moment',
                'message': """
📱 **Training Simulation Alert** 📱

You clicked a link in a simulated smishing (SMS phishing) message!

**Red flags you might have missed:**
• Unexpected message from unknown number
• Urgent action required
• Suspicious shortened URL
• Request to verify account/payment

**Best practices for SMS security:**
1. Don't click links in unexpected texts
2. Verify sender through official channels
3. Look out for urgent/threatening language
4. Report suspicious messages

**Keep learning - you're getting better at this!** 💪
                """,
                'micro_lessons': ['smishing_awareness', 'mobile_security', 'url_verification']
            },
            'landing_visited': {
                'title': 'Simulation Landing Page Visited',
                'message': """
🌐 **Training Simulation Alert** 🌐

You visited a simulated phishing landing page. Here's what to watch for:

**Warning signs on websites:**
• URL doesn't match the claimed organization
• Poor design or spelling errors
• Requests for sensitive information
• Missing security indicators (HTTPS, certificates)

**Before entering any information:**
1. Check the URL carefully
2. Look for security certificates
3. Verify it's the official website
4. Never enter passwords on suspicious sites

**This was a safe training environment!** ✅
                """,
                'micro_lessons': ['website_verification', 'url_analysis', 'secure_browsing']
            },
            'landing_form_submitted': {
                'title': 'Form Submitted - Critical Learning Moment',
                'message': """
⚠️ **CRITICAL Training Alert** ⚠️

You submitted information on a simulated phishing page! This is a crucial learning moment.

**What just happened:**
• You provided information to a fake website
• In a real attack, your data could be stolen
• This demonstrates how convincing phishing can be

**Key lessons:**
1. Always verify website authenticity before submitting data
2. Look for HTTPS and security certificates
3. Be suspicious of urgent requests for information
4. When in doubt, contact the organization directly

**Don't worry - this was training and your data is safe!** 🔒

**Recommended next steps:**
• Complete the assigned micro-lessons
• Practice identifying phishing websites
• Share this experience with colleagues
                """,
                'micro_lessons': ['data_protection', 'form_security', 'phishing_psychology', 'incident_response']
            }
        }
        
        # Micro-lesson library
        self.micro_lessons = {
            'phishing_identification': {
                'title': 'How to Identify Phishing Emails',
                'duration': '5 minutes',
                'content': 'Interactive lesson on spotting phishing attempts',
                'quiz_questions': 3
            },
            'link_safety': {
                'title': 'Safe Link Practices',
                'duration': '3 minutes',
                'content': 'Learn to verify links before clicking',
                'quiz_questions': 2
            },
            'smishing_awareness': {
                'title': 'SMS Phishing (Smishing) Awareness',
                'duration': '4 minutes',
                'content': 'Recognize and avoid SMS-based attacks',
                'quiz_questions': 3
            },
            'website_verification': {
                'title': 'Verifying Website Authenticity',
                'duration': '6 minutes',
                'content': 'Check if websites are legitimate',
                'quiz_questions': 4
            }
        }

    async def start(self):
        """Start the coach worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['coach_send'], self.handle_coaching_request, 'coach_workers')
        logger.info("Coach worker started")

    async def stop(self):
        """Stop the coach worker"""
        self.is_running = False
        logger.info("Coach worker stopped")

    async def handle_coaching_request(self, data: Dict[str, Any], msg):
        """Handle coaching request"""
        try:
            request_type = data.get('type')
            
            if request_type == 'trigger_coaching':
                result = await self.trigger_just_in_time_coaching(data)
            elif request_type == 'assign_lesson':
                result = await self.assign_micro_lesson(data)
            elif request_type == 'get_progress':
                result = await self.get_user_progress(data)
            else:
                raise ValueError(f"Unknown coaching request type: {request_type}")
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond(result)
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling coaching request: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def trigger_just_in_time_coaching(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Trigger immediate coaching based on user action"""
        event_type = data.get('event_type')
        user_id = data.get('user_id')
        campaign_id = data.get('campaign_id')
        org_id = data.get('org_id')
        
        # Get coaching template for event type
        coaching_template = self.coaching_templates.get(event_type)
        if not coaching_template:
            return {
                'success': False,
                'error': f'No coaching template for event type: {event_type}'
            }
        
        # Personalize coaching message
        personalized_coaching = await self._personalize_coaching(
            coaching_template, user_id, campaign_id, data.get('context', {})
        )
        
        # Store coaching session
        coaching_session = await self._create_coaching_session(
            user_id, org_id, campaign_id, event_type, personalized_coaching
        )
        
        # Auto-assign relevant micro-lessons
        assigned_lessons = []
        for lesson_id in coaching_template.get('micro_lessons', []):
            lesson_assignment = await self._assign_micro_lesson_to_user(
                user_id, lesson_id, coaching_session['id']
            )
            assigned_lessons.append(lesson_assignment)
        
        # Send coaching notification (this would integrate with frontend)
        await self._send_coaching_notification(user_id, coaching_session)
        
        return {
            'success': True,
            'coaching_session_id': coaching_session['id'],
            'message': personalized_coaching['message'],
            'assigned_lessons': assigned_lessons,
            'triggered_at': datetime.utcnow().isoformat()
        }

    async def _personalize_coaching(self, template: Dict[str, Any], user_id: str, campaign_id: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """Personalize coaching message based on user and context"""
        # Get user information
        user_info = await self._get_user_info(user_id)
        
        # Get campaign information
        campaign_info = await self._get_campaign_info(campaign_id)
        
        # Customize message based on user's history
        user_history = await self._get_user_coaching_history(user_id)
        
        personalized_message = template['message']
        
        # Add personalization based on user's previous interactions
        if len(user_history) > 0:
            personalized_message += f"\n\n**Your Progress:** You've completed {len(user_history)} previous training sessions. Keep up the great work!"
        
        # Add campaign-specific context if available
        if campaign_info and campaign_info.get('name'):
            personalized_message += f"\n\n**Campaign:** {campaign_info['name']}"
        
        return {
            'title': template['title'],
            'message': personalized_message,
            'micro_lessons': template['micro_lessons']
        }

    async def _create_coaching_session(self, user_id: str, org_id: str, campaign_id: str, event_type: str, coaching_content: Dict[str, Any]) -> Dict[str, Any]:
        """Create a coaching session record"""
        session_id = f"coaching_{user_id}_{datetime.utcnow().timestamp()}"
        
        session = {
            'id': session_id,
            'user_id': user_id,
            'org_id': org_id,
            'campaign_id': campaign_id,
            'event_type': event_type,
            'coaching_content': coaching_content,
            'status': 'active',
            'created_at': datetime.utcnow(),
            'completed_at': None
        }
        
        # Store in Redis for quick access
        redis = await get_redis_client()
        await redis.setex(
            f"coaching_session:{session_id}",
            86400,  # 24 hours TTL
            json.dumps(session, default=str)
        )
        
        # Also store in database for persistence
        # This would be implemented with actual database schema
        logger.info(f"Coaching session created: {session_id}")
        
        return session

    async def _assign_micro_lesson_to_user(self, user_id: str, lesson_id: str, coaching_session_id: str) -> Dict[str, Any]:
        """Assign a micro-lesson to a user"""
        lesson = self.micro_lessons.get(lesson_id)
        if not lesson:
            raise ValueError(f"Unknown lesson ID: {lesson_id}")
        
        assignment_id = f"assignment_{user_id}_{lesson_id}_{datetime.utcnow().timestamp()}"
        
        assignment = {
            'id': assignment_id,
            'user_id': user_id,
            'lesson_id': lesson_id,
            'lesson_title': lesson['title'],
            'coaching_session_id': coaching_session_id,
            'status': 'assigned',
            'assigned_at': datetime.utcnow(),
            'due_date': datetime.utcnow() + timedelta(days=7),  # 7 days to complete
            'completed_at': None,
            'score': None
        }
        
        # Store assignment
        redis = await get_redis_client()
        await redis.setex(
            f"lesson_assignment:{assignment_id}",
            604800,  # 7 days TTL
            json.dumps(assignment, default=str)
        )
        
        # Add to user's assignment list
        await redis.sadd(f"user_assignments:{user_id}", assignment_id)
        await redis.expire(f"user_assignments:{user_id}", 604800)
        
        logger.info(f"Micro-lesson assigned: {lesson_id} to user {user_id}")
        
        return assignment

    async def assign_micro_lesson(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Manually assign a micro-lesson to a user"""
        user_id = data.get('user_id')
        lesson_id = data.get('lesson_id')
        
        assignment = await self._assign_micro_lesson_to_user(user_id, lesson_id, None)
        
        return {
            'success': True,
            'assignment': assignment
        }

    async def get_user_progress(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Get user's coaching and lesson progress"""
        user_id = data.get('user_id')
        
        # Get coaching history
        coaching_history = await self._get_user_coaching_history(user_id)
        
        # Get lesson assignments
        lesson_assignments = await self._get_user_lesson_assignments(user_id)
        
        # Calculate progress metrics
        total_assignments = len(lesson_assignments)
        completed_assignments = len([a for a in lesson_assignments if a['status'] == 'completed'])
        completion_rate = (completed_assignments / total_assignments * 100) if total_assignments > 0 else 0
        
        return {
            'success': True,
            'user_id': user_id,
            'coaching_sessions': len(coaching_history),
            'total_assignments': total_assignments,
            'completed_assignments': completed_assignments,
            'completion_rate': completion_rate,
            'recent_sessions': coaching_history[-5:],  # Last 5 sessions
            'pending_assignments': [a for a in lesson_assignments if a['status'] == 'assigned']
        }

    async def _get_user_info(self, user_id: str) -> Dict[str, Any]:
        """Get user information"""
        # This would query the database for user details
        return {
            'id': user_id,
            'name': 'User Name',  # Placeholder
            'email': 'user@example.com'  # Placeholder
        }

    async def _get_campaign_info(self, campaign_id: str) -> Dict[str, Any]:
        """Get campaign information"""
        # This would query the database for campaign details
        return {
            'id': campaign_id,
            'name': 'Security Awareness Campaign',  # Placeholder
            'type': 'email'  # Placeholder
        }

    async def _get_user_coaching_history(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's coaching session history"""
        redis = await get_redis_client()
        
        # Get all coaching sessions for user
        # This is a simplified implementation
        sessions = []
        
        # In a real implementation, this would query the database
        logger.debug(f"Retrieved coaching history for user: {user_id}")
        
        return sessions

    async def _get_user_lesson_assignments(self, user_id: str) -> List[Dict[str, Any]]:
        """Get user's lesson assignments"""
        redis = await get_redis_client()
        
        # Get assignment IDs for user
        assignment_ids = await redis.smembers(f"user_assignments:{user_id}")
        
        assignments = []
        for assignment_id in assignment_ids:
            assignment_data = await redis.get(f"lesson_assignment:{assignment_id}")
            if assignment_data:
                assignment = json.loads(assignment_data)
                assignments.append(assignment)
        
        return assignments

    async def _send_coaching_notification(self, user_id: str, coaching_session: Dict[str, Any]):
        """Send coaching notification to user"""
        # This would integrate with the frontend notification system
        # For now, just log the notification
        logger.info(f"Coaching notification sent to user {user_id}: {coaching_session['coaching_content']['title']}")
        
        # Store notification for frontend to pick up
        redis = await get_redis_client()
        notification = {
            'type': 'coaching',
            'user_id': user_id,
            'title': coaching_session['coaching_content']['title'],
            'message': coaching_session['coaching_content']['message'][:200] + '...',
            'session_id': coaching_session['id'],
            'created_at': datetime.utcnow().isoformat()
        }
        
        await redis.lpush(f"notifications:{user_id}", json.dumps(notification))
        await redis.ltrim(f"notifications:{user_id}", 0, 50)  # Keep last 50 notifications
        await redis.expire(f"notifications:{user_id}", 86400)  # 24 hours TTL
