"""
Notification service for sending emails to guardians
Uses Resend (or SendGrid) for email delivery
"""

import os
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta

try:
    from resend import Resend
    RESEND_AVAILABLE = True
except ImportError:
    RESEND_AVAILABLE = False
    logging.warning("Resend not available. Install with: pip install resend")

try:
    import sendgrid
    from sendgrid.helpers.mail import Mail, Email, To, Content
    SENDGRID_AVAILABLE = True
except ImportError:
    SENDGRID_AVAILABLE = False
    logging.warning("SendGrid not available. Install with: pip install sendgrid")

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending notifications to guardians"""

    def __init__(self):
        self.resend_api_key = os.getenv("RESEND_API_KEY")
        self.sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        self.from_email = os.getenv("NOTIFICATION_FROM_EMAIL", "noreply@charon.estate")
        self.from_name = os.getenv("NOTIFICATION_FROM_NAME", "Project Charon")
        self.base_url = os.getenv("FRONTEND_URL", "http://localhost:3000")

        # Initialize email service
        self.resend_client = None
        self.sendgrid_client = None

        if RESEND_AVAILABLE and self.resend_api_key:
            self.resend_client = Resend(api_key=self.resend_api_key)
            logger.info("Resend email service initialized")
        elif SENDGRID_AVAILABLE and self.sendgrid_api_key:
            self.sendgrid_client = sendgrid.SendGridAPIClient(api_key=self.sendgrid_api_key)
            logger.info("SendGrid email service initialized")
        else:
            logger.warning("No email service configured. Notifications will be logged only.")

    def _send_via_resend(
        self, to_email: str, subject: str, html_content: str
    ) -> bool:
        """Send email via Resend"""
        if not self.resend_client:
            return False

        try:
            params = {
                "from": f"{self.from_name} <{self.from_email}>",
                "to": [to_email],
                "subject": subject,
                "html": html_content,
            }

            email = self.resend_client.Emails.send(params)
            logger.info(f"Email sent via Resend to {to_email}: {email.get('id', 'unknown')}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email via Resend: {e}")
            return False

    def _send_via_sendgrid(
        self, to_email: str, subject: str, html_content: str
    ) -> bool:
        """Send email via SendGrid"""
        if not self.sendgrid_client:
            return False

        try:
            message = Mail(
                from_email=Email(self.from_email, self.from_name),
                to_emails=To(to_email),
                subject=subject,
                html_content=Content("text/html", html_content),
            )

            response = self.sendgrid_client.send(message)
            logger.info(f"Email sent via SendGrid to {to_email}: {response.status_code}")
            return response.status_code in [200, 201, 202]
        except Exception as e:
            logger.error(f"Failed to send email via SendGrid: {e}")
            return False

    def send_guardian_notification(
        self,
        guardian_email: str,
        guardian_address: str,
        user_address: str,
        user_name: Optional[str] = None,
        verification_timestamp: Optional[datetime] = None,
        grace_period_hours: int = 72,
    ) -> bool:
        """
        Send death verification notification to a guardian

        Args:
            guardian_email: Guardian's email address
            guardian_address: Guardian's wallet address
            user_address: User's wallet address
            user_name: Optional user name
            verification_timestamp: When verification was initiated
            grace_period_hours: Grace period in hours (default 72)

        Returns:
            True if email sent successfully, False otherwise
        """
        grace_period_end = (
            verification_timestamp + timedelta(hours=grace_period_hours)
            if verification_timestamp
            else datetime.utcnow() + timedelta(hours=grace_period_hours)
        )

        guardian_url = f"{self.base_url}/guardian/{user_address}"

        subject = "Death Verification Request - Action Required"

        html_content = self._generate_guardian_email_template(
            guardian_address=guardian_address,
            user_address=user_address,
            user_name=user_name or "User",
            verification_timestamp=verification_timestamp or datetime.utcnow(),
            grace_period_end=grace_period_end,
            guardian_url=guardian_url,
        )

        # Try Resend first, then SendGrid, then log
        if self.resend_client:
            return self._send_via_resend(guardian_email, subject, html_content)
        elif self.sendgrid_client:
            return self._send_via_sendgrid(guardian_email, subject, html_content)
        else:
            # Log email content for development
            logger.info(f"Email notification (not sent - no service configured):")
            logger.info(f"  To: {guardian_email}")
            logger.info(f"  Subject: {subject}")
            logger.info(f"  URL: {guardian_url}")
            return False

    def _generate_guardian_email_template(
        self,
        guardian_address: str,
        user_address: str,
        user_name: str,
        verification_timestamp: datetime,
        grace_period_end: datetime,
        guardian_url: str,
    ) -> str:
        """Generate HTML email template for guardian notification"""
        return f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }}
        .container {{
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }}
        .header {{
            border-bottom: 2px solid #e5e5e5;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }}
        .header h1 {{
            color: #2c3e50;
            font-size: 24px;
            margin: 0;
            font-weight: 600;
        }}
        .content {{
            color: #555;
            font-size: 16px;
        }}
        .info-box {{
            background-color: #f8f9fa;
            border-left: 4px solid #6c757d;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
        }}
        .info-box strong {{
            color: #495057;
        }}
        .cta-button {{
            display: inline-block;
            background-color: #2c3e50;
            color: #ffffff;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 30px 0;
            text-align: center;
        }}
        .cta-button:hover {{
            background-color: #34495e;
        }}
        .footer {{
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e5e5;
            font-size: 14px;
            color: #888;
        }}
        .urgent {{
            background-color: #fff3cd;
            border-left-color: #ffc107;
        }}
        .address {{
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #666;
            word-break: break-all;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Death Verification Request</h1>
        </div>
        
        <div class="content">
            <p>Dear Guardian,</p>
            
            <p>You have been designated as a guardian for <strong>{user_name}</strong> in the Project Charon digital estate management system.</p>
            
            <div class="info-box">
                <p><strong>Verification Status:</strong> Pending Guardian Confirmation</p>
                <p><strong>User Address:</strong> <span class="address">{user_address}</span></p>
                <p><strong>Verification Initiated:</strong> {verification_timestamp.strftime('%B %d, %Y at %I:%M %p UTC')}</p>
                <p><strong>Grace Period Ends:</strong> {grace_period_end.strftime('%B %d, %Y at %I:%M %p UTC')}</p>
            </div>
            
            <p>The automated verification system was unable to conclusively determine the status. As a guardian, your confirmation is required to proceed with the digital will execution process.</p>
            
            <p><strong>This is a solemn responsibility.</strong> Please take time to verify the information through appropriate channels before proceeding.</p>
            
            <div style="text-align: center;">
                <a href="{guardian_url}" class="cta-button">Access Guardian Portal</a>
            </div>
            
            <div class="info-box urgent">
                <p><strong>Important:</strong> You have 72 hours (grace period) to review and confirm. If you need additional time, you may request a 24-hour extension (maximum 2 extensions).</p>
            </div>
            
            <p>If you have any questions or concerns, please contact the Project Charon support team.</p>
            
            <p>With respect,<br>
            <strong>Project Charon Team</strong></p>
        </div>
        
        <div class="footer">
            <p>This is an automated notification from Project Charon. Please do not reply to this email.</p>
            <p>Your guardian address: <span class="address">{guardian_address}</span></p>
        </div>
    </div>
</body>
</html>
        """

    def send_guardian_reminder(
        self,
        guardian_email: str,
        guardian_address: str,
        user_address: str,
        hours_remaining: int,
    ) -> bool:
        """Send reminder email to guardian"""
        subject = f"Reminder: Death Verification Request ({hours_remaining} hours remaining)"
        
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }}
        .container {{
            background-color: #ffffff;
            border-radius: 8px;
            padding: 40px;
        }}
        .urgent {{
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Reminder: Action Required</h1>
        <p>This is a reminder that you have a pending death verification request.</p>
        <div class="urgent">
            <p><strong>Time Remaining:</strong> {hours_remaining} hours</p>
        </div>
        <p>Please access the guardian portal to review and confirm:</p>
        <p><a href="{self.base_url}/guardian/{user_address}">Access Portal</a></p>
    </div>
</body>
</html>
        """
        
        if self.resend_client:
            return self._send_via_resend(guardian_email, subject, html_content)
        elif self.sendgrid_client:
            return self._send_via_sendgrid(guardian_email, subject, html_content)
        else:
            logger.info(f"Reminder email (not sent): {guardian_email}")
            return False


# Global service instance
notification_service = NotificationService()

