"""
Export Worker - Generate reports, board packs, and compliance exports
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import io
import base64
from dataclasses import dataclass
import pandas as pd
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
import matplotlib.pyplot as plt
import seaborn as sns

from shared.database import get_clickhouse_client, get_redis_client, get_async_session
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

@dataclass
class ExportRequest:
    export_type: str  # 'board_pack', 'compliance_report', 'csv_export', 'scorm_package'
    org_id: str
    user_id: str
    date_range: Dict[str, str]
    filters: Dict[str, Any]
    format: str  # 'pdf', 'csv', 'json', 'scorm', 'xapi'
    template: str
    delivery_method: str  # 'download', 'email', 's3'

class ExportWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Report templates
        self.report_templates = {
            'executive_summary': {
                'title': 'Executive Security Awareness Summary',
                'sections': ['overview', 'key_metrics', 'risk_assessment', 'recommendations']
            },
            'board_pack': {
                'title': 'Board Security Awareness Report',
                'sections': ['executive_summary', 'program_metrics', 'risk_trends', 'compliance_status', 'action_items']
            },
            'compliance_report': {
                'title': 'Security Awareness Compliance Report',
                'sections': ['training_completion', 'policy_compliance', 'incident_metrics', 'audit_trail']
            },
            'campaign_analysis': {
                'title': 'Campaign Performance Analysis',
                'sections': ['campaign_overview', 'engagement_metrics', 'learning_outcomes', 'user_performance']
            }
        }

    async def start(self):
        """Start the export worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['export_make'], self.handle_export_request, 'export_workers')
        logger.info("Export worker started")

    async def stop(self):
        """Stop the export worker"""
        self.is_running = False
        logger.info("Export worker stopped")

    async def handle_export_request(self, data: Dict[str, Any], msg):
        """Handle export generation request"""
        try:
            export_request = ExportRequest(
                export_type=data.get('export_type'),
                org_id=data.get('org_id'),
                user_id=data.get('user_id'),
                date_range=data.get('date_range', {}),
                filters=data.get('filters', {}),
                format=data.get('format', 'pdf'),
                template=data.get('template', 'executive_summary'),
                delivery_method=data.get('delivery_method', 'download')
            )
            
            # Generate the export
            result = await self.generate_export(export_request)
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond(result)
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling export request: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def generate_export(self, request: ExportRequest) -> Dict[str, Any]:
        """Generate export based on request parameters"""
        try:
            # Collect data for the export
            export_data = await self._collect_export_data(request)
            
            # Generate the export based on format
            if request.format == 'pdf':
                export_file = await self._generate_pdf_report(request, export_data)
            elif request.format == 'csv':
                export_file = await self._generate_csv_export(request, export_data)
            elif request.format == 'json':
                export_file = await self._generate_json_export(request, export_data)
            elif request.format == 'scorm':
                export_file = await self._generate_scorm_package(request, export_data)
            elif request.format == 'xapi':
                export_file = await self._generate_xapi_package(request, export_data)
            else:
                raise ValueError(f"Unsupported export format: {request.format}")
            
            # Handle delivery
            delivery_result = await self._handle_delivery(request, export_file)
            
            return {
                'success': True,
                'export_id': f"export_{request.org_id}_{datetime.utcnow().timestamp()}",
                'format': request.format,
                'size': len(export_file) if isinstance(export_file, bytes) else len(str(export_file)),
                'delivery': delivery_result,
                'generated_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to generate export: {e}")
            return {
                'success': False,
                'error': str(e)
            }

    async def _collect_export_data(self, request: ExportRequest) -> Dict[str, Any]:
        """Collect data needed for the export"""
        clickhouse = get_clickhouse_client()
        redis = await get_redis_client()
        
        # Date range setup
        start_date = datetime.fromisoformat(request.date_range.get('start', (datetime.utcnow() - timedelta(days=30)).isoformat()))
        end_date = datetime.fromisoformat(request.date_range.get('end', datetime.utcnow().isoformat()))
        
        data = {
            'organization': await self._get_organization_data(request.org_id),
            'date_range': {'start': start_date, 'end': end_date},
            'campaigns': await self._get_campaign_data(request.org_id, start_date, end_date),
            'users': await self._get_user_data(request.org_id, start_date, end_date),
            'events': await self._get_event_data(request.org_id, start_date, end_date),
            'training': await self._get_training_data(request.org_id, start_date, end_date),
            'risk_scores': await self._get_risk_data(request.org_id),
            'compliance': await self._get_compliance_data(request.org_id, start_date, end_date)
        }
        
        return data

    async def _get_organization_data(self, org_id: str) -> Dict[str, Any]:
        """Get organization information"""
        # This would query the database for organization details
        return {
            'id': org_id,
            'name': 'Sample Organization',
            'total_users': 500,
            'active_users': 485,
            'departments': ['IT', 'Finance', 'HR', 'Sales', 'Marketing']
        }

    async def _get_campaign_data(self, org_id: str, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get campaign performance data"""
        clickhouse = get_clickhouse_client()
        
        query = """
        SELECT 
            campaign_id,
            COUNT(*) as total_events,
            SUM(CASE WHEN event_type = 'email_sent' THEN 1 ELSE 0 END) as sent_count,
            SUM(CASE WHEN event_type = 'email_opened' THEN 1 ELSE 0 END) as opened_count,
            SUM(CASE WHEN event_type = 'email_clicked' THEN 1 ELSE 0 END) as clicked_count,
            SUM(CASE WHEN event_type = 'email_reported' THEN 1 ELSE 0 END) as reported_count
        FROM ai_defense_events.events 
        WHERE org_id = %(org_id)s 
        AND timestamp BETWEEN %(start_date)s AND %(end_date)s
        GROUP BY campaign_id
        """
        
        try:
            results = clickhouse.execute(query, {
                'org_id': org_id,
                'start_date': start_date,
                'end_date': end_date
            })
            
            campaigns = []
            for row in results:
                campaign_id, total_events, sent, opened, clicked, reported = row
                campaigns.append({
                    'id': campaign_id,
                    'total_events': total_events,
                    'sent_count': sent,
                    'opened_count': opened,
                    'clicked_count': clicked,
                    'reported_count': reported,
                    'click_rate': (clicked / sent * 100) if sent > 0 else 0,
                    'report_rate': (reported / sent * 100) if sent > 0 else 0
                })
            
            return campaigns
            
        except Exception as e:
            logger.error(f"Failed to get campaign data: {e}")
            return []

    async def _get_user_data(self, org_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get user performance data"""
        # Mock user data - in real implementation, this would query the database
        return {
            'total_users': 500,
            'active_users': 485,
            'high_risk_users': 45,
            'training_completed': 420,
            'average_score': 78.5,
            'departments': {
                'IT': {'users': 50, 'avg_score': 85.2, 'high_risk': 2},
                'Finance': {'users': 75, 'avg_score': 72.1, 'high_risk': 8},
                'HR': {'users': 25, 'avg_score': 81.3, 'high_risk': 1},
                'Sales': {'users': 150, 'avg_score': 74.8, 'high_risk': 18},
                'Marketing': {'users': 100, 'avg_score': 79.2, 'high_risk': 12}
            }
        }

    async def _get_event_data(self, org_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get event statistics"""
        # Mock event data
        return {
            'total_events': 15420,
            'emails_sent': 2500,
            'emails_opened': 1875,
            'emails_clicked': 312,
            'emails_reported': 156,
            'sms_sent': 800,
            'sms_clicked': 89,
            'training_completed': 420,
            'coaching_sessions': 312
        }

    async def _get_training_data(self, org_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get training completion data"""
        return {
            'total_lessons': 24,
            'completed_lessons': 18,
            'average_completion_time': 6.5,  # minutes
            'completion_rate': 85.2,
            'average_score': 78.5,
            'certifications_issued': 156,
            'learning_paths': {
                'email_security': {'completion_rate': 92.1, 'avg_score': 81.2},
                'social_engineering': {'completion_rate': 78.5, 'avg_score': 75.8},
                'incident_response': {'completion_rate': 65.3, 'avg_score': 72.1}
            }
        }

    async def _get_risk_data(self, org_id: str) -> Dict[str, Any]:
        """Get risk scoring data"""
        redis = await get_redis_client()
        
        # Get risk scores from Redis
        risk_scores = await redis.zrevrange(f"org_risk_scores:{org_id}", 0, -1, withscores=True)
        
        if not risk_scores:
            # Mock risk data
            return {
                'average_risk_score': 35.2,
                'high_risk_users': 45,
                'medium_risk_users': 125,
                'low_risk_users': 330,
                'risk_trend': 'improving',
                'top_risk_factors': [
                    {'factor': 'Click Rate', 'impact': 35.2},
                    {'factor': 'Training Completion', 'impact': -25.1},
                    {'factor': 'Report Rate', 'impact': -18.3}
                ]
            }
        
        # Process actual risk scores
        scores = [float(score) for _, score in risk_scores]
        avg_score = sum(scores) / len(scores) if scores else 0
        
        return {
            'average_risk_score': avg_score,
            'high_risk_users': len([s for s in scores if s >= 75]),
            'medium_risk_users': len([s for s in scores if 50 <= s < 75]),
            'low_risk_users': len([s for s in scores if s < 50]),
            'risk_trend': 'stable'  # Would calculate trend from historical data
        }

    async def _get_compliance_data(self, org_id: str, start_date: datetime, end_date: datetime) -> Dict[str, Any]:
        """Get compliance metrics"""
        return {
            'training_compliance': 85.2,
            'policy_acknowledgment': 92.1,
            'incident_reporting': 78.5,
            'audit_readiness': 88.7,
            'standards_coverage': {
                'NIST CSF': 85.0,
                'ISO 27001': 72.0,
                'SANS': 95.0
            },
            'compliance_trend': 'improving'
        }

    async def _generate_pdf_report(self, request: ExportRequest, data: Dict[str, Any]) -> bytes:
        """Generate PDF report"""
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=letter)
        styles = getSampleStyleSheet()
        story = []
        
        # Custom styles
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=30,
            textColor=colors.HexColor('#1f2937')
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            spaceAfter=12,
            textColor=colors.HexColor('#374151')
        )
        
        # Title
        template = self.report_templates.get(request.template, self.report_templates['executive_summary'])
        story.append(Paragraph(template['title'], title_style))
        story.append(Spacer(1, 20))
        
        # Organization info
        story.append(Paragraph(f"Organization: {data['organization']['name']}", styles['Normal']))
        story.append(Paragraph(f"Report Period: {data['date_range']['start'].strftime('%Y-%m-%d')} to {data['date_range']['end'].strftime('%Y-%m-%d')}", styles['Normal']))
        story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC", styles['Normal']))
        story.append(Spacer(1, 30))
        
        # Executive Summary
        if 'overview' in template['sections'] or 'executive_summary' in template['sections']:
            story.append(Paragraph("Executive Summary", heading_style))
            
            summary_data = [
                ['Metric', 'Value', 'Status'],
                ['Total Users', str(data['organization']['total_users']), '✓'],
                ['Training Completion', f"{data['training']['completion_rate']:.1f}%", '✓' if data['training']['completion_rate'] >= 80 else '⚠'],
                ['Average Risk Score', f"{data['risk_scores']['average_risk_score']:.1f}", '✓' if data['risk_scores']['average_risk_score'] < 50 else '⚠'],
                ['High Risk Users', str(data['risk_scores']['high_risk_users']), '⚠' if data['risk_scores']['high_risk_users'] > 50 else '✓']
            ]
            
            summary_table = Table(summary_data)
            summary_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            
            story.append(summary_table)
            story.append(Spacer(1, 20))
        
        # Key Metrics
        if 'key_metrics' in template['sections'] or 'program_metrics' in template['sections']:
            story.append(Paragraph("Key Metrics", heading_style))
            
            metrics_data = [
                ['Campaign Metrics', 'Value'],
                ['Total Campaigns', str(len(data['campaigns']))],
                ['Emails Sent', str(data['events']['emails_sent'])],
                ['Click Rate', f"{sum(c['click_rate'] for c in data['campaigns']) / len(data['campaigns']):.1f}%" if data['campaigns'] else "0%"],
                ['Report Rate', f"{sum(c['report_rate'] for c in data['campaigns']) / len(data['campaigns']):.1f}%" if data['campaigns'] else "0%"],
                ['Training Completed', str(data['training']['completed_lessons'])],
                ['Certifications Issued', str(data['training']['certifications_issued'])]
            ]
            
            metrics_table = Table(metrics_data)
            metrics_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#f3f4f6')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
            ]))
            
            story.append(metrics_table)
            story.append(Spacer(1, 20))
        
        # Risk Assessment
        if 'risk_assessment' in template['sections'] or 'risk_trends' in template['sections']:
            story.append(Paragraph("Risk Assessment", heading_style))
            
            risk_text = f"""
            Current average risk score: {data['risk_scores']['average_risk_score']:.1f}/100
            
            Risk Distribution:
            • Low Risk Users: {data['risk_scores']['low_risk_users']} ({data['risk_scores']['low_risk_users']/data['organization']['total_users']*100:.1f}%)
            • Medium Risk Users: {data['risk_scores']['medium_risk_users']} ({data['risk_scores']['medium_risk_users']/data['organization']['total_users']*100:.1f}%)
            • High Risk Users: {data['risk_scores']['high_risk_users']} ({data['risk_scores']['high_risk_users']/data['organization']['total_users']*100:.1f}%)
            
            Risk Trend: {data['risk_scores']['risk_trend'].title()}
            """
            
            story.append(Paragraph(risk_text, styles['Normal']))
            story.append(Spacer(1, 20))
        
        # Recommendations
        if 'recommendations' in template['sections'] or 'action_items' in template['sections']:
            story.append(Paragraph("Recommendations", heading_style))
            
            recommendations = self._generate_recommendations(data)
            for i, rec in enumerate(recommendations, 1):
                story.append(Paragraph(f"{i}. {rec}", styles['Normal']))
            
            story.append(Spacer(1, 20))
        
        # Build PDF
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    async def _generate_csv_export(self, request: ExportRequest, data: Dict[str, Any]) -> str:
        """Generate CSV export"""
        if request.export_type == 'campaign_data':
            # Campaign performance CSV
            df = pd.DataFrame(data['campaigns'])
            return df.to_csv(index=False)
        
        elif request.export_type == 'user_data':
            # User performance CSV
            user_data = []
            for dept, info in data['users']['departments'].items():
                user_data.append({
                    'Department': dept,
                    'Total Users': info['users'],
                    'Average Score': info['avg_score'],
                    'High Risk Users': info['high_risk']
                })
            
            df = pd.DataFrame(user_data)
            return df.to_csv(index=False)
        
        else:
            # General metrics CSV
            metrics_data = [
                {'Metric': 'Total Users', 'Value': data['organization']['total_users']},
                {'Metric': 'Training Completion Rate', 'Value': f"{data['training']['completion_rate']:.1f}%"},
                {'Metric': 'Average Risk Score', 'Value': f"{data['risk_scores']['average_risk_score']:.1f}"},
                {'Metric': 'High Risk Users', 'Value': data['risk_scores']['high_risk_users']},
                {'Metric': 'Emails Sent', 'Value': data['events']['emails_sent']},
                {'Metric': 'Emails Clicked', 'Value': data['events']['emails_clicked']},
                {'Metric': 'Emails Reported', 'Value': data['events']['emails_reported']}
            ]
            
            df = pd.DataFrame(metrics_data)
            return df.to_csv(index=False)

    async def _generate_json_export(self, request: ExportRequest, data: Dict[str, Any]) -> str:
        """Generate JSON export"""
        export_data = {
            'export_info': {
                'type': request.export_type,
                'format': request.format,
                'generated_at': datetime.utcnow().isoformat(),
                'org_id': request.org_id,
                'date_range': {
                    'start': data['date_range']['start'].isoformat(),
                    'end': data['date_range']['end'].isoformat()
                }
            },
            'data': data
        }
        
        return json.dumps(export_data, indent=2, default=str)

    async def _generate_scorm_package(self, request: ExportRequest, data: Dict[str, Any]) -> bytes:
        """Generate SCORM 1.2 package"""
        # This would create a full SCORM package with manifest, content, and tracking
        # For now, return a mock ZIP structure
        
        manifest_xml = f"""<?xml version="1.0" encoding="UTF-8"?>
<manifest identifier="AI_Defense_Training_{request.org_id}" version="1.0"
          xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2"
          xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  
  <metadata>
    <schema>ADL SCORM</schema>
    <schemaversion>1.2</schemaversion>
  </metadata>
  
  <organizations default="AI_Defense_Org">
    <organization identifier="AI_Defense_Org">
      <title>AI Social Engineering Defense Training</title>
      <item identifier="lesson_1" identifierref="resource_1">
        <title>Phishing Identification</title>
      </item>
    </organization>
  </organizations>
  
  <resources>
    <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="lesson1.html">
      <file href="lesson1.html"/>
    </resource>
  </resources>
</manifest>"""
        
        # In a real implementation, this would create a proper ZIP file
        return manifest_xml.encode('utf-8')

    async def _generate_xapi_package(self, request: ExportRequest, data: Dict[str, Any]) -> str:
        """Generate xAPI (Tin Can API) statements"""
        statements = []
        
        # Generate xAPI statements for training completions
        for i in range(data['training']['completed_lessons']):
            statement = {
                "id": f"statement_{i}_{datetime.utcnow().timestamp()}",
                "actor": {
                    "mbox": f"mailto:user{i}@{request.org_id}.com",
                    "name": f"User {i}"
                },
                "verb": {
                    "id": "http://adlnet.gov/expapi/verbs/completed",
                    "display": {"en-US": "completed"}
                },
                "object": {
                    "id": f"http://ai-defense-trainer.com/lessons/lesson_{i}",
                    "definition": {
                        "name": {"en-US": f"Security Awareness Lesson {i}"},
                        "type": "http://adlnet.gov/expapi/activities/lesson"
                    }
                },
                "result": {
                    "score": {
                        "scaled": 0.85,
                        "raw": 85,
                        "min": 0,
                        "max": 100
                    },
                    "success": True,
                    "completion": True
                },
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            statements.append(statement)
        
        return json.dumps(statements, indent=2)

    def _generate_recommendations(self, data: Dict[str, Any]) -> List[str]:
        """Generate actionable recommendations based on data"""
        recommendations = []
        
        # Risk-based recommendations
        if data['risk_scores']['high_risk_users'] > data['organization']['total_users'] * 0.1:
            recommendations.append("Implement targeted training for high-risk users to reduce security exposure")
        
        # Training completion recommendations
        if data['training']['completion_rate'] < 80:
            recommendations.append("Increase training completion rates through manager engagement and incentives")
        
        # Campaign effectiveness recommendations
        if data['campaigns']:
            avg_click_rate = sum(c['click_rate'] for c in data['campaigns']) / len(data['campaigns'])
            if avg_click_rate > 15:
                recommendations.append("Review and enhance phishing simulation difficulty to improve user awareness")
        
        # Compliance recommendations
        if data['compliance']['training_compliance'] < 90:
            recommendations.append("Strengthen compliance tracking and reporting mechanisms")
        
        # Department-specific recommendations
        for dept, info in data['users']['departments'].items():
            if info['high_risk'] > info['users'] * 0.15:
                recommendations.append(f"Focus additional security training resources on {dept} department")
        
        return recommendations[:5]  # Limit to top 5 recommendations

    async def _handle_delivery(self, request: ExportRequest, export_file: bytes) -> Dict[str, Any]:
        """Handle export delivery based on method"""
        if request.delivery_method == 'download':
            # Store in Redis for download
            redis = await get_redis_client()
            download_key = f"export_download:{request.org_id}:{datetime.utcnow().timestamp()}"
            
            # Store file data (base64 encoded for Redis)
            file_data = base64.b64encode(export_file).decode('utf-8') if isinstance(export_file, bytes) else export_file
            
            await redis.setex(download_key, 3600, file_data)  # 1 hour TTL
            
            return {
                'method': 'download',
                'download_key': download_key,
                'expires_at': (datetime.utcnow() + timedelta(hours=1)).isoformat()
            }
        
        elif request.delivery_method == 'email':
            # Send via email (would integrate with email service)
            return {
                'method': 'email',
                'sent_to': f"user@{request.org_id}.com",
                'sent_at': datetime.utcnow().isoformat()
            }
        
        elif request.delivery_method == 's3':
            # Upload to S3 (would integrate with S3 service)
            return {
                'method': 's3',
                'bucket': self.settings.s3_bucket,
                'key': f"exports/{request.org_id}/export_{datetime.utcnow().timestamp()}.{request.format}",
                'url': f"https://{self.settings.s3_bucket}.s3.amazonaws.com/exports/{request.org_id}/export_{datetime.utcnow().timestamp()}.{request.format}"
            }
        
        else:
            raise ValueError(f"Unsupported delivery method: {request.delivery_method}")

    async def get_export_status(self, export_id: str) -> Dict[str, Any]:
        """Get status of an export job"""
        redis = await get_redis_client()
        
        status_data = await redis.get(f"export_status:{export_id}")
        if status_data:
            return json.loads(status_data)
        
        return {
            'export_id': export_id,
            'status': 'not_found',
            'message': 'Export not found or expired'
        }

    async def list_available_templates(self) -> Dict[str, Any]:
        """List available report templates"""
        return {
            'templates': self.report_templates,
            'formats': ['pdf', 'csv', 'json', 'scorm', 'xapi'],
            'delivery_methods': ['download', 'email', 's3']
        }
