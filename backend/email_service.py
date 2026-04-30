"""
Email Notification Service for BisaFit

Handles:
1. Instant notifications when beta feedback is submitted
2. Weekly analytics report emails
"""

import os
import asyncio
import logging
import resend
from datetime import datetime
from typing import Optional, Dict, Any, List

logger = logging.getLogger(__name__)

# Initialize Resend
resend.api_key = os.environ.get('RESEND_API_KEY')
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'samuel.m.tibs@gmail.com')
SENDER_EMAIL = "BisaFit <onboarding@resend.dev>"  # Use Resend's test domain

async def send_email(
    to_email: str,
    subject: str,
    html_content: str
) -> Dict[str, Any]:
    """Send an email using Resend API (non-blocking)"""
    
    if not resend.api_key:
        logger.error("RESEND_API_KEY not configured")
        return {"status": "error", "message": "Email service not configured"}
    
    params = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": subject,
        "html": html_content
    }
    
    try:
        # Run sync SDK in thread to keep FastAPI non-blocking
        email = await asyncio.to_thread(resend.Emails.send, params)
        logger.info(f"Email sent successfully to {to_email}: {email.get('id')}")
        return {
            "status": "success",
            "message": f"Email sent to {to_email}",
            "email_id": email.get("id")
        }
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        return {"status": "error", "message": str(e)}


async def send_feedback_notification(feedback_data: Dict[str, Any]) -> Dict[str, Any]:
    """Send notification when new beta feedback is submitted"""
    
    rating = feedback_data.get('overallRating', 0)
    stars = '★' * rating + '☆' * (5 - rating)
    
    # Format the feedback nicely
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: #121212; color: white; padding: 20px; border-radius: 8px 8px 0 0; }}
            .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 8px 8px; }}
            .rating {{ font-size: 24px; color: #f59e0b; }}
            .section {{ margin: 15px 0; padding: 15px; background: white; border-radius: 8px; }}
            .section-title {{ font-weight: 600; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }}
            .badge {{ display: inline-block; padding: 4px 12px; background: #e5e5e5; border-radius: 20px; font-size: 14px; }}
            .highlight {{ background: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h2 style="margin: 0;">🏋️ New Beta Feedback Received</h2>
                <p style="margin: 5px 0 0 0; opacity: 0.8;">BisaFit App</p>
            </div>
            <div class="content">
                <div class="section">
                    <div class="section-title">Overall Rating</div>
                    <div class="rating">{stars}</div>
                    <span class="badge">{feedback_data.get('wouldRecommend', 'N/A').replace('_', ' ').title()}</span>
                </div>
                
                <div class="section">
                    <div class="section-title">Quick Summary</div>
                    <table style="width: 100%; font-size: 14px;">
                        <tr>
                            <td><strong>Onboarding:</strong></td>
                            <td>{feedback_data.get('onboardingClarity', 'N/A').replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td><strong>Design:</strong></td>
                            <td>{feedback_data.get('designRating', 'N/A').replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td><strong>Navigation:</strong></td>
                            <td>{feedback_data.get('navigationEase', 'N/A').replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td><strong>Mobile Experience:</strong></td>
                            <td>{feedback_data.get('mobileExperience', 'N/A').replace('_', ' ').title()}</td>
                        </tr>
                        <tr>
                            <td><strong>Workout Format:</strong></td>
                            <td>{feedback_data.get('workoutEnjoyment', 'N/A').replace('_', ' ').title()}</td>
                        </tr>
                    </table>
                </div>
                
                {"<div class='section'><div class='section-title'>Favorite Features</div><p>" + ', '.join(feedback_data.get('favoriteFeatures', [])) + "</p></div>" if feedback_data.get('favoriteFeatures') else ""}
                
                {"<div class='highlight'><div class='section-title'>🐛 Bugs Reported</div><p>" + feedback_data.get('bugsEncountered', '') + "</p></div>" if feedback_data.get('bugsEncountered') else ""}
                
                {"<div class='section'><div class='section-title'>Missing Features</div><p>" + feedback_data.get('missingFeatures', '') + "</p></div>" if feedback_data.get('missingFeatures') else ""}
                
                {"<div class='highlight' style='background: #dbeafe; border-color: #3b82f6;'><div class='section-title'>💡 One Improvement Suggestion</div><p><strong>" + feedback_data.get('oneImprovement', '') + "</strong></p></div>" if feedback_data.get('oneImprovement') else ""}
                
                {"<div class='section'><div class='section-title'>Additional Comments</div><p>" + feedback_data.get('additionalComments', '') + "</p></div>" if feedback_data.get('additionalComments') else ""}
                
                {"<div class='section'><div class='section-title'>Attachments</div><p>" + str(len(feedback_data.get('bugAttachments', []))) + " file(s) attached - <a href='https://bisafit-enhance-1.preview.emergentagent.com/admin/analytics'>View in Dashboard</a></p></div>" if feedback_data.get('bugAttachments') else ""}
                
                <div class="section" style="font-size: 12px; color: #666;">
                    <div class="section-title">Device Info</div>
                    <p>{feedback_data.get('deviceInfo', 'Not provided')}</p>
                    <p>Submitted: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
                </div>
                
                <p style="text-align: center; margin-top: 20px;">
                    <a href="https://bisafit-enhance-1.preview.emergentagent.com/admin/analytics" 
                       style="display: inline-block; padding: 12px 24px; background: #121212; color: white; text-decoration: none; border-radius: 8px;">
                        View Full Analytics Dashboard
                    </a>
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🏋️ New Beta Feedback: {stars} ({rating}/5)",
        html_content=html_content
    )


async def send_weekly_analytics_report(analytics_data: Dict[str, Any]) -> Dict[str, Any]:
    """Send weekly analytics summary report"""
    
    total_users = analytics_data.get('totalUsers', 0)
    total_events = analytics_data.get('totalEvents', 0)
    total_feedback = analytics_data.get('totalFeedback', 0)
    avg_rating = analytics_data.get('avgRating', 0)
    top_events = analytics_data.get('topEvents', [])
    recent_feedback = analytics_data.get('recentFeedback', [])
    
    # Format top events
    top_events_html = ""
    for i, event in enumerate(top_events[:10], 1):
        top_events_html += f"<tr><td>{i}.</td><td>{event['name']}</td><td>{event['count']}</td></tr>"
    
    # Format recent feedback
    feedback_html = ""
    for fb in recent_feedback[:5]:
        rating = fb.get('overallRating', 0)
        stars = '★' * rating + '☆' * (5 - rating)
        feedback_html += f"""
        <tr>
            <td>{stars}</td>
            <td>{fb.get('oneImprovement', 'N/A')[:100]}...</td>
        </tr>
        """
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #121212, #2d2d2d); color: white; padding: 30px; border-radius: 12px 12px 0 0; }}
            .content {{ background: #f9f9f9; padding: 20px; border-radius: 0 0 12px 12px; }}
            .stats {{ display: flex; gap: 10px; margin: 20px 0; }}
            .stat-card {{ flex: 1; background: white; padding: 15px; border-radius: 8px; text-align: center; }}
            .stat-number {{ font-size: 28px; font-weight: bold; color: #121212; }}
            .stat-label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
            .section {{ margin: 20px 0; padding: 20px; background: white; border-radius: 8px; }}
            .section-title {{ font-weight: 600; color: #333; font-size: 16px; margin-bottom: 15px; }}
            table {{ width: 100%; border-collapse: collapse; }}
            td {{ padding: 8px; border-bottom: 1px solid #eee; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0;">📊 Weekly Analytics Report</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.8;">BisaFit Beta Testing - Week of {datetime.now().strftime('%B %d, %Y')}</p>
            </div>
            <div class="content">
                <div style="display: table; width: 100%; margin: 20px 0;">
                    <div style="display: table-cell; width: 25%; padding: 10px; text-align: center; background: white; border-radius: 8px;">
                        <div class="stat-number">{total_users}</div>
                        <div class="stat-label">Users</div>
                    </div>
                    <div style="display: table-cell; width: 25%; padding: 10px; text-align: center; background: white; border-radius: 8px;">
                        <div class="stat-number">{total_events}</div>
                        <div class="stat-label">Events</div>
                    </div>
                    <div style="display: table-cell; width: 25%; padding: 10px; text-align: center; background: white; border-radius: 8px;">
                        <div class="stat-number">{total_feedback}</div>
                        <div class="stat-label">Feedback</div>
                    </div>
                    <div style="display: table-cell; width: 25%; padding: 10px; text-align: center; background: white; border-radius: 8px;">
                        <div class="stat-number">{avg_rating:.1f}⭐</div>
                        <div class="stat-label">Avg Rating</div>
                    </div>
                </div>
                
                <div class="section">
                    <div class="section-title">🔥 Top Events This Week</div>
                    <table>
                        <tr style="background: #f5f5f5;">
                            <td width="30">#</td>
                            <td>Event Name</td>
                            <td width="60">Count</td>
                        </tr>
                        {top_events_html if top_events_html else "<tr><td colspan='3'>No events recorded yet</td></tr>"}
                    </table>
                </div>
                
                <div class="section">
                    <div class="section-title">💬 Recent Feedback Highlights</div>
                    <table>
                        <tr style="background: #f5f5f5;">
                            <td width="80">Rating</td>
                            <td>Key Improvement Suggestion</td>
                        </tr>
                        {feedback_html if feedback_html else "<tr><td colspan='2'>No feedback received yet</td></tr>"}
                    </table>
                </div>
                
                <p style="text-align: center; margin-top: 30px;">
                    <a href="https://bisafit-enhance-1.preview.emergentagent.com/admin/analytics" 
                       style="display: inline-block; padding: 14px 28px; background: #121212; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        View Full Dashboard →
                    </a>
                </p>
                
                <p style="text-align: center; font-size: 12px; color: #999; margin-top: 20px;">
                    This report is automatically generated every week.<br>
                    BisaFit Beta Analytics
                </p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=ADMIN_EMAIL,
        subject=f"📊 BisaFit Weekly Report: {total_feedback} feedback, {avg_rating:.1f}⭐ avg rating",
        html_content=html_content
    )


async def send_store_interest_confirmation(
    to_email: str,
    interests: List[str]
) -> Dict[str, Any]:
    """Send confirmation email when user signs up for store notifications"""
    
    # Map interests to friendly names
    interest_labels = {
        'apparel': '👕 Workout Apparel',
        'accessories': '⌚ Accessories',
        'equipment': '🏋️ Fitness Equipment',
    }
    
    interests_html = ""
    if interests:
        interests_html = "<ul style='margin: 10px 0; padding-left: 20px;'>"
        for interest in interests:
            label = interest_labels.get(interest, interest.title())
            interests_html += f"<li>{label}</li>"
        interests_html += "</ul>"
    else:
        interests_html = "<p>All categories</p>"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #121212, #2d2d2d); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }}
            .highlight {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">🛍️ You're on the list!</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">BisaFit Store Waitlist</p>
            </div>
            <div class="content">
                <p>Hey there! 👋</p>
                
                <p>Thanks for joining the BisaFit Store waitlist! We're working hard to bring you premium fitness gear that matches your dedication.</p>
                
                <div class="highlight">
                    <strong>Your interests:</strong>
                    {interests_html}
                </div>
                
                <p>Here's what you can expect:</p>
                <ul>
                    <li>🎯 Early access to new product drops</li>
                    <li>💰 Exclusive member discounts</li>
                    <li>📦 First dibs on limited editions</li>
                </ul>
                
                <p>We'll email you the moment the store goes live. Until then, keep crushing those workouts! 💪</p>
                
                <div class="footer">
                    <p>Questions? Reply to this email or reach out at support@bisafit.com</p>
                    <p style="opacity: 0.6;">BisaFit • Your Fitness Journey Partner</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=to_email,
        subject="🛍️ You're on the BisaFit Store waitlist!",
        html_content=html_content
    )


async def send_store_interest_admin_notification(
    user_email: str,
    interests: List[str]
) -> Dict[str, Any]:
    """Notify admin when someone joins the store waitlist"""
    
    interests_str = ', '.join(interests) if interests else 'All categories'
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 500px; margin: 0 auto; padding: 20px; }}
            .card {{ background: #f9f9f9; padding: 20px; border-radius: 8px; border-left: 4px solid #10b981; }}
        </style>
    </head>
    <body>
        <div class="container">
            <h2>🛍️ New Store Waitlist Signup</h2>
            <div class="card">
                <p><strong>Email:</strong> {user_email}</p>
                <p><strong>Interests:</strong> {interests_str}</p>
                <p><strong>Time:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=ADMIN_EMAIL,
        subject=f"🛍️ Store Waitlist: {user_email}",
        html_content=html_content
    )


async def send_legal_document_update_notification(
    to_email: str,
    doc_type: str,
    doc_title: str,
    doc_version: str,
    app_url: str = "https://bisafit.com"
) -> Dict[str, Any]:
    """
    Send notification when legal documents are updated.
    
    Args:
        to_email: User's email address
        doc_type: 'terms' or 'privacy'
        doc_title: Title of the document (e.g., "Terms of Service")
        doc_version: Version number (e.g., "1.1")
        app_url: Base URL of the app
    """
    
    doc_url = f"{app_url}/{doc_type}"
    icon = "📋" if doc_type == "terms" else "🔒"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #121212, #2d2d2d); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 12px 12px; }}
            .highlight {{ background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }}
            .button {{ display: inline-block; padding: 14px 28px; background: #121212; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px; }}
            .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">{icon} Legal Document Update</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">BisaFit</p>
            </div>
            <div class="content">
                <p>Hello,</p>
                
                <p>We've updated our <strong>{doc_title}</strong> to version {doc_version}. These updates help us serve you better and ensure transparency in how we operate.</p>
                
                <div class="highlight">
                    <strong>What's Updated:</strong>
                    <p>{doc_title} (Version {doc_version})</p>
                    <a href="{doc_url}" class="button">Review {doc_title}</a>
                </div>
                
                <p>By continuing to use BisaFit, you agree to the updated terms. If you have any questions about these changes, please don't hesitate to reach out to us.</p>
                
                <p>Thank you for being part of BisaFit!</p>
                
                <div class="footer">
                    <p>Bisa Group, LLC • Delaware, USA</p>
                    <p style="opacity: 0.6;">You're receiving this because you have a BisaFit account.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    
    return await send_email(
        to_email=to_email,
        subject=f"{icon} BisaFit {doc_title} Updated (v{doc_version})",
        html_content=html_content
    )


async def send_legal_update_batch(
    user_emails: List[str],
    doc_type: str,
    doc_title: str,
    doc_version: str,
    app_url: str = "https://bisafit.com",
    batch_size: int = 500
) -> Dict[str, Any]:
    """
    Send legal update notifications to users in batches.
    
    Args:
        user_emails: List of user email addresses
        doc_type: 'terms' or 'privacy'
        doc_title: Title of the document
        doc_version: Version number
        app_url: Base URL of the app
        batch_size: Number of emails to send per batch (default 500)
    
    Returns:
        Summary of batch operation
    """
    
    total = len(user_emails)
    sent = 0
    failed = 0
    errors = []
    
    logger.info(f"Starting legal update email batch: {total} users, doc_type={doc_type}, version={doc_version}")
    
    # Process in batches
    for i in range(0, total, batch_size):
        batch = user_emails[i:i + batch_size]
        batch_num = (i // batch_size) + 1
        total_batches = (total + batch_size - 1) // batch_size
        
        logger.info(f"Processing batch {batch_num}/{total_batches} ({len(batch)} emails)")
        
        for email in batch:
            try:
                result = await send_legal_document_update_notification(
                    to_email=email,
                    doc_type=doc_type,
                    doc_title=doc_title,
                    doc_version=doc_version,
                    app_url=app_url
                )
                
                if result.get("status") == "success":
                    sent += 1
                else:
                    failed += 1
                    errors.append({"email": email, "error": result.get("message")})
                    
            except Exception as e:
                failed += 1
                errors.append({"email": email, "error": str(e)})
        
        # Small delay between batches to avoid rate limiting
        if i + batch_size < total:
            await asyncio.sleep(1)
    
    logger.info(f"Legal update email batch complete: {sent} sent, {failed} failed")
    
    return {
        "status": "complete",
        "total": total,
        "sent": sent,
        "failed": failed,
        "errors": errors[:10] if errors else []  # Return first 10 errors only
    }
