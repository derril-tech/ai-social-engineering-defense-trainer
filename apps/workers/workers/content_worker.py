"""
Content Worker - Safe template generation with AI and guardrails
"""

import asyncio
import logging
import re
from typing import Dict, Any, List, Optional
from datetime import datetime
import openai
import anthropic
from jinja2 import Template, Environment, select_autoescape

from shared.database import get_async_session, get_redis_client
from shared.message_bus import subscribe_to_topic, publish_message, TOPICS
from shared.config import get_settings

logger = logging.getLogger(__name__)

class ContentSafetyError(Exception):
    """Raised when content fails safety checks"""
    pass

class ContentWorker:
    def __init__(self):
        self.settings = get_settings()
        self.is_running = False
        self.processed_count = 0
        self.error_count = 0
        
        # Initialize AI clients
        if self.settings.openai_api_key:
            self.openai_client = openai.AsyncOpenAI(api_key=self.settings.openai_api_key)
        else:
            self.openai_client = None
            
        if self.settings.anthropic_api_key:
            self.anthropic_client = anthropic.AsyncAnthropic(api_key=self.settings.anthropic_api_key)
        else:
            self.anthropic_client = None
        
        # Jinja2 environment for template rendering
        self.jinja_env = Environment(
            autoescape=select_autoescape(['html', 'xml']),
            trim_blocks=True,
            lstrip_blocks=True
        )
        
        # Content safety patterns
        self.forbidden_patterns = [
            r'\b(password|credential|login|signin|authenticate)\b',
            r'\b(urgent|immediate|expire|suspend|verify now)\b',
            r'\b(click here|download now|act now)\b',
            r'\b(social security|ssn|credit card|bank account)\b'
        ]
        
        # Safe template categories
        self.template_categories = {
            'phishing_email': {
                'difficulty': ['beginner', 'intermediate', 'advanced'],
                'themes': ['security_update', 'account_verification', 'urgent_action', 'reward_claim']
            },
            'smishing_sms': {
                'difficulty': ['beginner', 'intermediate', 'advanced'],
                'themes': ['delivery_notification', 'account_alert', 'prize_winner', 'verification_code']
            },
            'vishing_script': {
                'difficulty': ['beginner', 'intermediate', 'advanced'],
                'themes': ['tech_support', 'bank_security', 'survey_call', 'prize_notification']
            },
            'chat_message': {
                'difficulty': ['beginner', 'intermediate', 'advanced'],
                'themes': ['colleague_request', 'it_support', 'urgent_help', 'file_sharing']
            }
        }

    async def start(self):
        """Start the content worker"""
        self.is_running = True
        await subscribe_to_topic(TOPICS['content_make'], self.handle_content_request, 'content_workers')
        logger.info("Content worker started")

    async def stop(self):
        """Stop the content worker"""
        self.is_running = False
        logger.info("Content worker stopped")

    async def handle_content_request(self, data: Dict[str, Any], msg):
        """Handle content generation request"""
        try:
            request_type = data.get('type')
            
            if request_type == 'generate_template':
                result = await self.generate_template(data)
            elif request_type == 'validate_template':
                result = await self.validate_template(data)
            elif request_type == 'render_template':
                result = await self.render_template(data)
            else:
                raise ValueError(f"Unknown request type: {request_type}")
            
            # Send response if reply_to is provided
            if msg.reply:
                await msg.respond(result)
            
            self.processed_count += 1
            
        except Exception as e:
            logger.error(f"Error handling content request: {e}")
            self.error_count += 1
            
            if msg.reply:
                await msg.respond({
                    'success': False,
                    'error': str(e)
                })

    async def generate_template(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate a safe template using AI"""
        category = data.get('category', 'phishing_email')
        difficulty = data.get('difficulty', 'beginner')
        theme = data.get('theme')
        organization_context = data.get('organization_context', {})
        
        # Validate inputs
        if category not in self.template_categories:
            raise ValueError(f"Invalid category: {category}")
        
        if difficulty not in self.template_categories[category]['difficulty']:
            raise ValueError(f"Invalid difficulty for {category}: {difficulty}")
        
        if theme and theme not in self.template_categories[category]['themes']:
            raise ValueError(f"Invalid theme for {category}: {theme}")
        
        # Generate content using AI
        if self.openai_client:
            content = await self._generate_with_openai(category, difficulty, theme, organization_context)
        elif self.anthropic_client:
            content = await self._generate_with_anthropic(category, difficulty, theme, organization_context)
        else:
            content = await self._generate_fallback_template(category, difficulty, theme)
        
        # Apply safety checks
        await self._validate_content_safety(content)
        
        # Add watermarks and safety notices
        content = await self._add_safety_watermarks(content, category)
        
        return {
            'success': True,
            'content': content,
            'category': category,
            'difficulty': difficulty,
            'theme': theme,
            'generated_at': datetime.utcnow().isoformat(),
            'safety_checked': True
        }

    async def _generate_with_openai(self, category: str, difficulty: str, theme: str, context: Dict[str, Any]) -> str:
        """Generate content using OpenAI"""
        system_prompt = self._build_system_prompt(category, difficulty)
        user_prompt = self._build_user_prompt(category, theme, context)
        
        response = await self.openai_client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            max_tokens=1000,
            temperature=0.7
        )
        
        return response.choices[0].message.content

    async def _generate_with_anthropic(self, category: str, difficulty: str, theme: str, context: Dict[str, Any]) -> str:
        """Generate content using Anthropic Claude"""
        system_prompt = self._build_system_prompt(category, difficulty)
        user_prompt = self._build_user_prompt(category, theme, context)
        
        response = await self.anthropic_client.messages.create(
            model="claude-3-sonnet-20240229",
            max_tokens=1000,
            system=system_prompt,
            messages=[
                {"role": "user", "content": user_prompt}
            ]
        )
        
        return response.content[0].text

    def _build_system_prompt(self, category: str, difficulty: str) -> str:
        """Build system prompt for AI generation"""
        return f"""You are creating educational phishing simulation content for cybersecurity training. 

CRITICAL REQUIREMENTS:
1. This is for EDUCATIONAL PURPOSES ONLY - to train people to recognize social engineering
2. Content must be OBVIOUSLY SIMULATED with clear safety watermarks
3. NEVER include real credentials, actual company names, or harmful instructions
4. Include educational "tells" that help users learn to spot real attacks
5. Content should be {difficulty} level difficulty for training purposes

Category: {category}
Purpose: Security awareness training simulation
Safety: All content will be watermarked and used in controlled training environment

Generate realistic but safe training content that helps users learn to identify social engineering tactics."""

    def _build_user_prompt(self, category: str, theme: str, context: Dict[str, Any]) -> str:
        """Build user prompt for AI generation"""
        org_name = context.get('organization_name', '[ORGANIZATION]')
        user_name = context.get('user_name', '[USER_NAME]')
        
        prompts = {
            'phishing_email': f"Create a phishing email simulation with theme '{theme}' for organization '{org_name}'. Include subject line, sender, and body. Use placeholder {{{{user_name}}}} for personalization.",
            'smishing_sms': f"Create an SMS phishing simulation with theme '{theme}'. Keep it under 160 characters and include educational tells.",
            'vishing_script': f"Create a voice phishing script with theme '{theme}' for training purposes. Include conversation flow and common tactics.",
            'chat_message': f"Create a chat/instant message phishing simulation with theme '{theme}' for workplace training."
        }
        
        return prompts.get(category, f"Create a {category} simulation with theme '{theme}'")

    async def _generate_fallback_template(self, category: str, difficulty: str, theme: str) -> str:
        """Generate fallback template when AI services are unavailable"""
        templates = {
            'phishing_email': {
                'security_update': """Subject: [TRAINING SIMULATION] Security Update Required
From: security-noreply@training-simulation.com

Dear {{user_name}},

[🚨 TRAINING SIMULATION - NOT REAL 🚨]

Our security team has detected unusual activity on your account. Please verify your identity by clicking the link below:

[SIMULATED LINK - DO NOT CLICK IN REAL SCENARIOS]

This is a training simulation. In a real attack, you should:
1. Verify the sender's identity
2. Check for urgent language
3. Hover over links before clicking
4. Report suspicious emails

[TRAINING SIMULATION WATERMARK]""",
                
                'account_verification': """Subject: [TRAINING SIMULATION] Account Verification Needed
From: accounts@training-simulation.com

Hello {{user_name}},

[🚨 TRAINING SIMULATION - NOT REAL 🚨]

Your account requires immediate verification to prevent suspension.

Educational tells in this simulation:
- Generic greeting
- Urgent language
- Suspicious sender domain
- Request for immediate action

[TRAINING SIMULATION WATERMARK]"""
            }
        }
        
        return templates.get(category, {}).get(theme, f"[TRAINING SIMULATION] Sample {category} content for {theme}")

    async def _validate_content_safety(self, content: str):
        """Validate content against safety rules"""
        if not self.settings.content_safety_enabled:
            return
        
        # Check for forbidden patterns
        for pattern in self.forbidden_patterns:
            if re.search(pattern, content, re.IGNORECASE):
                raise ContentSafetyError(f"Content contains forbidden pattern: {pattern}")
        
        # Check length
        if len(content) > self.settings.max_template_length:
            raise ContentSafetyError(f"Content exceeds maximum length: {len(content)}")
        
        # Check for real URLs or domains
        url_pattern = r'https?://(?!training-simulation\.com|localhost|127\.0\.0\.1)[^\s]+'
        if re.search(url_pattern, content):
            raise ContentSafetyError("Content contains potentially real URLs")

    async def _add_safety_watermarks(self, content: str, category: str) -> str:
        """Add safety watermarks to content"""
        watermarks = {
            'header': '[🚨 TRAINING SIMULATION - NOT REAL 🚨]',
            'footer': '[TRAINING SIMULATION WATERMARK - FOR EDUCATIONAL PURPOSES ONLY]'
        }
        
        if category == 'phishing_email':
            # Add watermarks to email content
            if 'Subject:' in content:
                content = content.replace('Subject:', 'Subject: [TRAINING SIMULATION]')
            
            if watermarks['header'] not in content:
                content = f"{watermarks['header']}\n\n{content}"
            
            if watermarks['footer'] not in content:
                content = f"{content}\n\n{watermarks['footer']}"
        
        return content

    async def validate_template(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate a template for safety and compliance"""
        content = data.get('content', '')
        
        try:
            await self._validate_content_safety(content)
            return {
                'success': True,
                'valid': True,
                'message': 'Template passed safety validation'
            }
        except ContentSafetyError as e:
            return {
                'success': True,
                'valid': False,
                'message': str(e)
            }

    async def render_template(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """Render template with user data"""
        template_content = data.get('template', '')
        user_data = data.get('user_data', {})
        
        try:
            template = self.jinja_env.from_string(template_content)
            rendered = template.render(**user_data)
            
            # Validate rendered content
            await self._validate_content_safety(rendered)
            
            return {
                'success': True,
                'rendered_content': rendered
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }
