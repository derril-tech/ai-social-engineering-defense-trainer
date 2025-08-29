import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LandingService {
    constructor(private configService: ConfigService) { }

    async generateLandingPage(
        campaignId: string,
        userId: string,
        templateId: string,
    ): Promise<string> {
        // Get template information (this would query the database)
        const template = await this.getTemplate(templateId);

        // Generate safe landing page with watermarks
        const landingPage = this.buildLandingPageHTML(
            campaignId,
            userId,
            template,
        );

        return landingPage;
    }

    async generateCoachingResponse(
        campaignId: string,
        userId: string,
        triggerType: string,
    ): Promise<string> {
        const coachingContent = this.getCoachingContent(triggerType);

        return this.buildCoachingPageHTML(
            campaignId,
            userId,
            coachingContent,
        );
    }

    private async getTemplate(templateId: string): Promise<any> {
        // This would query the database for template details
        // For now, return mock data
        return {
            id: templateId,
            name: 'Security Update Required',
            type: 'login_form',
            content: {
                title: 'Security Update Required',
                description: 'Please verify your account to continue',
                form_fields: ['email', 'password'],
            },
        };
    }

    private buildLandingPageHTML(
        campaignId: string,
        userId: string,
        template: any,
    ): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${template.content.title} - Training Simulation</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .container {
            background: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .training-banner {
            background: #ff6b35;
            color: white;
            padding: 15px;
            text-align: center;
            margin: -30px -30px 30px -30px;
            border-radius: 8px 8px 0 0;
            font-weight: bold;
            font-size: 18px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="email"], input[type="password"], input[type="text"] {
            width: 100%;
            padding: 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .submit-btn {
            background: #007cba;
            color: white;
            padding: 12px 30px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
        }
        .submit-btn:hover {
            background: #005a87;
        }
        .watermark {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(255, 107, 53, 0.9);
            color: white;
            text-align: center;
            padding: 5px;
            font-size: 12px;
            z-index: 1000;
        }
        .security-notice {
            background: #fff3cd;
            border: 1px solid #ffeaa7;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
        .tells-hint {
            background: #e8f4fd;
            border-left: 4px solid #007cba;
            padding: 15px;
            margin-top: 20px;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="watermark">
        🚨 TRAINING SIMULATION - NOT A REAL WEBSITE 🚨
    </div>
    
    <div class="container">
        <div class="training-banner">
            🎓 PHISHING SIMULATION - EDUCATIONAL PURPOSE ONLY
        </div>
        
        <h1>${template.content.title}</h1>
        <p>${template.content.description}</p>
        
        <div class="security-notice">
            <strong>⚠️ Training Notice:</strong> This is a simulated phishing page for security awareness training. 
            Any information entered here will NOT be stored or used maliciously.
        </div>
        
        <form id="simulationForm" action="/api/v1/landing/${campaignId}/${userId}/submit" method="POST">
            <div class="form-group">
                <label for="email">Email Address:</label>
                <input type="email" id="email" name="email" required>
            </div>
            
            <div class="form-group">
                <label for="password">Password:</label>
                <input type="password" id="password" name="password" required>
            </div>
            
            <button type="submit" class="submit-btn">
                Verify Account
            </button>
        </form>
        
        <div class="tells-hint">
            <strong>🔍 Learning Opportunity:</strong> Can you spot the warning signs that this might be a phishing attempt?
            <ul>
                <li>Check the URL in your browser's address bar</li>
                <li>Look for spelling or grammar errors</li>
                <li>Notice any urgent or threatening language</li>
                <li>Verify the sender's identity through official channels</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <button onclick="reportPhishing()" style="background: #28a745; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer;">
                🚨 Report This as Phishing
            </button>
        </div>
    </div>
    
    <script>
        function reportPhishing() {
            fetch('/api/v1/landing/report/${campaignId}/${userId}', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    reason: 'suspicious_content',
                    method: 'manual_report'
                })
            })
            .then(response => response.json())
            .then(data => {
                alert('✅ Excellent! You correctly identified this as a phishing simulation. This is exactly what you should do with suspicious emails!');
                window.location.href = '/coaching/success';
            })
            .catch(error => {
                console.error('Error:', error);
            });
        }
        
        // Intercept form submission for coaching
        document.getElementById('simulationForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Show immediate coaching
            alert('⚠️ TRAINING ALERT: You just submitted credentials to a phishing site! In a real attack, your information could be stolen. This was a simulation to help you learn.');
            
            // Submit form for tracking
            this.submit();
        });
        
        // Add educational tooltips
        document.addEventListener('DOMContentLoaded', function() {
            const inputs = document.querySelectorAll('input');
            inputs.forEach(input => {
                input.addEventListener('focus', function() {
                    console.log('🎓 Training Tip: Always verify the website URL before entering sensitive information!');
                });
            });
        });
    </script>
</body>
</html>`;
    }

    private buildCoachingPageHTML(
        campaignId: string,
        userId: string,
        coachingContent: any,
    ): string {
        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Security Training - Learning Moment</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .success-header {
            text-align: center;
            margin-bottom: 30px;
        }
        .success-icon {
            font-size: 64px;
            margin-bottom: 20px;
        }
        .coaching-content {
            background: #f8f9fa;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #28a745;
        }
        .warning-content {
            background: #fff3cd;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #ffc107;
        }
        .next-steps {
            background: #e7f3ff;
            padding: 25px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 5px solid #007cba;
        }
        .btn {
            display: inline-block;
            padding: 12px 24px;
            margin: 10px;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            font-weight: bold;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .btn-primary {
            background: #007cba;
            color: white;
        }
        .btn-primary:hover {
            background: #005a87;
        }
        .btn-success {
            background: #28a745;
            color: white;
        }
        .btn-success:hover {
            background: #1e7e34;
        }
        .progress-bar {
            background: #e9ecef;
            border-radius: 10px;
            height: 20px;
            margin: 20px 0;
        }
        .progress-fill {
            background: #28a745;
            height: 100%;
            border-radius: 10px;
            width: 75%;
            transition: width 0.5s ease;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="success-header">
            <div class="success-icon">${coachingContent.icon}</div>
            <h1>${coachingContent.title}</h1>
            <p style="font-size: 18px; color: #666;">${coachingContent.subtitle}</p>
        </div>
        
        <div class="${coachingContent.type === 'success' ? 'coaching-content' : 'warning-content'}">
            <h3>${coachingContent.messageTitle}</h3>
            <p>${coachingContent.message}</p>
        </div>
        
        <div class="next-steps">
            <h3>🎯 Key Learning Points:</h3>
            <ul>
                ${coachingContent.learningPoints.map(point => `<li>${point}</li>`).join('')}
            </ul>
        </div>
        
        <div class="next-steps">
            <h3>📚 Recommended Next Steps:</h3>
            <p>Complete these micro-lessons to strengthen your security awareness:</p>
            <div style="margin-top: 20px;">
                <a href="/lessons/phishing-identification" class="btn btn-primary">
                    📧 Phishing Identification (5 min)
                </a>
                <a href="/lessons/link-safety" class="btn btn-primary">
                    🔗 Safe Link Practices (3 min)
                </a>
                <a href="/lessons/reporting" class="btn btn-primary">
                    🚨 How to Report Suspicious Content (2 min)
                </a>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px;">
            <h4>Your Security Awareness Progress</h4>
            <div class="progress-bar">
                <div class="progress-fill"></div>
            </div>
            <p>75% Complete - Keep up the great work! 🎉</p>
            
            <div style="margin-top: 30px;">
                <a href="/dashboard" class="btn btn-success">
                    📊 View Your Progress Dashboard
                </a>
                <a href="/training/continue" class="btn btn-primary">
                    📖 Continue Training
                </a>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
            <p style="color: #666; font-size: 14px;">
                <strong>Remember:</strong> When in doubt, always verify through official channels and report suspicious content to your IT security team.
            </p>
        </div>
    </div>
    
    <script>
        // Animate progress bar
        setTimeout(() => {
            document.querySelector('.progress-fill').style.width = '85%';
        }, 1000);
        
        // Track coaching completion
        fetch('/api/v1/analytics/coaching-completed', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                campaign_id: '${campaignId}',
                user_id: '${userId}',
                coaching_type: '${coachingContent.type}',
                timestamp: new Date().toISOString()
            })
        });
    </script>
</body>
</html>`;
    }

    private getCoachingContent(triggerType: string): any {
        const coachingTemplates = {
            form_submission: {
                type: 'warning',
                icon: '⚠️',
                title: 'Training Alert - Credentials Submitted',
                subtitle: 'This was a phishing simulation',
                messageTitle: 'What just happened?',
                message: 'You submitted login credentials to a simulated phishing website. In a real attack, cybercriminals could have stolen your username and password to access your accounts.',
                learningPoints: [
                    'Always verify the website URL before entering credentials',
                    'Look for HTTPS and valid security certificates',
                    'Be suspicious of urgent requests for login information',
                    'Use official apps or bookmarked links instead of email links',
                    'Enable two-factor authentication on important accounts'
                ]
            },
            phishing_report: {
                type: 'success',
                icon: '🎉',
                title: 'Excellent Work!',
                subtitle: 'You correctly identified this as suspicious',
                messageTitle: 'Perfect Response!',
                message: 'You did exactly the right thing by reporting this suspicious content. This proactive approach helps protect not just you, but your entire organization.',
                learningPoints: [
                    'Reporting suspicious emails helps protect everyone',
                    'Trust your instincts when something seems off',
                    'It\'s better to report a false positive than miss a real threat',
                    'Your security team appreciates these reports',
                    'You\'re becoming a human firewall for your organization'
                ]
            }
        };

        return coachingTemplates[triggerType] || coachingTemplates.form_submission;
    }
}
