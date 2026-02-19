"""
Stripe Subscription Service for BisaFit
Handles Checkout Sessions, Webhooks, and Customer Portal
"""

import os
import stripe
import logging
from typing import Optional, Dict, Any
from datetime import datetime
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Initialize Stripe
stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

# Subscription Price Lookup Keys - These map to Stripe Price IDs
# You'll create these in Stripe Dashboard with these lookup_keys
PRICE_LOOKUP_KEYS = {
    "bisafit_monthly": {
        "name": "BisaFit Monthly",
        "interval": "month",
        "description": "Monthly subscription to BisaFit Premium"
    },
    "bisafit_annual": {
        "name": "BisaFit Annual", 
        "interval": "year",
        "description": "Annual subscription to BisaFit Premium (save 40%)"
    }
}


async def get_or_create_stripe_customer(
    user_id: str,
    email: str,
    name: Optional[str] = None,
    existing_customer_id: Optional[str] = None
) -> str:
    """
    Get existing Stripe customer or create a new one.
    Returns the Stripe customer ID.
    """
    # If we have an existing customer ID, verify it exists
    if existing_customer_id:
        try:
            customer = stripe.Customer.retrieve(existing_customer_id)
            if not customer.get("deleted"):
                return existing_customer_id
        except stripe.error.InvalidRequestError:
            logger.warning(f"Stripe customer {existing_customer_id} not found, creating new one")
    
    # Search for existing customer by email
    customers = stripe.Customer.list(email=email, limit=1)
    if customers.data:
        return customers.data[0].id
    
    # Create new customer
    customer = stripe.Customer.create(
        email=email,
        name=name,
        metadata={
            "user_id": user_id,
            "source": "bisafit_app"
        }
    )
    
    logger.info(f"Created new Stripe customer {customer.id} for user {user_id}")
    return customer.id


async def create_checkout_session(
    user_id: str,
    email: str,
    price_lookup_key: str,
    success_url: str,
    cancel_url: str,
    customer_id: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a Stripe Checkout Session for subscription.
    
    Args:
        user_id: The BisaFit user ID
        email: User's email address
        price_lookup_key: Either "bisafit_monthly" or "bisafit_annual"
        success_url: URL to redirect after successful payment
        cancel_url: URL to redirect if payment is cancelled
        customer_id: Existing Stripe customer ID (optional)
    
    Returns:
        Dict with checkout session URL and session ID
    """
    
    # Validate price lookup key
    if price_lookup_key not in PRICE_LOOKUP_KEYS:
        raise ValueError(f"Invalid price lookup key: {price_lookup_key}")
    
    # Get or create Stripe customer
    stripe_customer_id = await get_or_create_stripe_customer(
        user_id=user_id,
        email=email,
        existing_customer_id=customer_id
    )
    
    # Look up the price by lookup_key
    prices = stripe.Price.list(lookup_keys=[price_lookup_key], active=True, limit=1)
    
    if not prices.data:
        raise ValueError(f"No active Stripe price found for lookup key: {price_lookup_key}. "
                        f"Please create a price in Stripe Dashboard with lookup_key='{price_lookup_key}'")
    
    price = prices.data[0]
    
    # Create checkout session
    session = stripe.checkout.Session.create(
        customer=stripe_customer_id,
        mode="subscription",
        payment_method_types=["card"],
        line_items=[{
            "price": price.id,
            "quantity": 1
        }],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_id": user_id,
            "price_lookup_key": price_lookup_key
        },
        subscription_data={
            "metadata": {
                "user_id": user_id,
                "price_lookup_key": price_lookup_key
            }
        },
        # Soft launch configuration
        allow_promotion_codes=False,
    )
    
    logger.info(f"Created checkout session {session.id} for user {user_id}")
    
    return {
        "url": session.url,
        "session_id": session.id,
        "customer_id": stripe_customer_id
    }


async def create_portal_session(
    customer_id: str,
    return_url: str
) -> Dict[str, str]:
    """
    Create a Stripe Billing Portal session for subscription management.
    
    Args:
        customer_id: Stripe customer ID
        return_url: URL to redirect after portal session
    
    Returns:
        Dict with portal session URL
    """
    
    if not customer_id:
        raise ValueError("Customer ID is required for portal session")
    
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url
    )
    
    logger.info(f"Created portal session for customer {customer_id}")
    
    return {
        "url": session.url
    }


async def handle_webhook_event(
    payload: bytes,
    sig_header: str
) -> Dict[str, Any]:
    """
    Handle incoming Stripe webhook events.
    
    Args:
        payload: Raw webhook payload bytes
        sig_header: Stripe-Signature header value
    
    Returns:
        Dict with event details and data to update in database
    """
    
    # Verify webhook signature
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError as e:
        logger.error(f"Invalid webhook payload: {e}")
        raise ValueError("Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logger.error(f"Invalid webhook signature: {e}")
        raise ValueError("Invalid signature")
    
    event_type = event["type"]
    event_data = event["data"]["object"]
    
    logger.info(f"Processing webhook event: {event_type}")
    
    result = {
        "event_type": event_type,
        "event_id": event["id"],
        "processed": True,
        "update_data": None
    }
    
    # Handle different event types
    if event_type == "checkout.session.completed":
        result["update_data"] = await handle_checkout_completed(event_data)
        
    elif event_type == "customer.subscription.created":
        result["update_data"] = await handle_subscription_created(event_data)
        
    elif event_type == "customer.subscription.updated":
        result["update_data"] = await handle_subscription_updated(event_data)
        
    elif event_type == "customer.subscription.deleted":
        result["update_data"] = await handle_subscription_deleted(event_data)
        
    elif event_type == "invoice.payment_failed":
        result["update_data"] = await handle_payment_failed(event_data)
    
    else:
        logger.info(f"Unhandled event type: {event_type}")
        result["processed"] = False
    
    return result


async def handle_checkout_completed(session: Dict) -> Optional[Dict[str, Any]]:
    """Handle checkout.session.completed event"""
    
    if session.get("mode") != "subscription":
        return None
    
    user_id = session.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("No user_id in checkout session metadata")
        return None
    
    subscription_id = session.get("subscription")
    customer_id = session.get("customer")
    
    # Get subscription details
    if subscription_id:
        subscription = stripe.Subscription.retrieve(subscription_id)
        current_period_end = datetime.fromtimestamp(subscription.current_period_end)
        status = subscription.status
    else:
        current_period_end = None
        status = "active"
    
    return {
        "user_id": user_id,
        "stripe_customer_id": customer_id,
        "stripe_subscription_id": subscription_id,
        "subscription_status": status,
        "current_period_end": current_period_end.isoformat() if current_period_end else None
    }


async def handle_subscription_created(subscription: Dict) -> Optional[Dict[str, Any]]:
    """Handle customer.subscription.created event"""
    
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        logger.warning("No user_id in subscription metadata")
        return None
    
    current_period_end = datetime.fromtimestamp(subscription["current_period_end"])
    
    return {
        "user_id": user_id,
        "stripe_customer_id": subscription["customer"],
        "stripe_subscription_id": subscription["id"],
        "subscription_status": subscription["status"],
        "current_period_end": current_period_end.isoformat()
    }


async def handle_subscription_updated(subscription: Dict) -> Optional[Dict[str, Any]]:
    """Handle customer.subscription.updated event"""
    
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        # Try to get user_id from customer metadata
        try:
            customer = stripe.Customer.retrieve(subscription["customer"])
            user_id = customer.get("metadata", {}).get("user_id")
        except:
            pass
    
    if not user_id:
        logger.warning("No user_id found for subscription update")
        return None
    
    current_period_end = datetime.fromtimestamp(subscription["current_period_end"])
    
    return {
        "user_id": user_id,
        "stripe_customer_id": subscription["customer"],
        "stripe_subscription_id": subscription["id"],
        "subscription_status": subscription["status"],
        "current_period_end": current_period_end.isoformat(),
        "cancel_at_period_end": subscription.get("cancel_at_period_end", False)
    }


async def handle_subscription_deleted(subscription: Dict) -> Optional[Dict[str, Any]]:
    """Handle customer.subscription.deleted event"""
    
    user_id = subscription.get("metadata", {}).get("user_id")
    if not user_id:
        try:
            customer = stripe.Customer.retrieve(subscription["customer"])
            user_id = customer.get("metadata", {}).get("user_id")
        except:
            pass
    
    if not user_id:
        logger.warning("No user_id found for subscription deletion")
        return None
    
    return {
        "user_id": user_id,
        "stripe_subscription_id": subscription["id"],
        "subscription_status": "canceled",
        "current_period_end": None
    }


async def handle_payment_failed(invoice: Dict) -> Optional[Dict[str, Any]]:
    """Handle invoice.payment_failed event"""
    
    subscription_id = invoice.get("subscription")
    if not subscription_id:
        return None
    
    # Get subscription to find user_id
    try:
        subscription = stripe.Subscription.retrieve(subscription_id)
        user_id = subscription.get("metadata", {}).get("user_id")
    except:
        user_id = None
    
    if not user_id:
        try:
            customer = stripe.Customer.retrieve(invoice["customer"])
            user_id = customer.get("metadata", {}).get("user_id")
        except:
            pass
    
    if not user_id:
        logger.warning("No user_id found for payment failure")
        return None
    
    return {
        "user_id": user_id,
        "subscription_status": "past_due",
        "payment_failed": True,
        "payment_failed_at": datetime.utcnow().isoformat()
    }


async def get_subscription_status(customer_id: str) -> Optional[Dict[str, Any]]:
    """
    Get current subscription status for a customer.
    
    Args:
        customer_id: Stripe customer ID
    
    Returns:
        Dict with subscription details or None
    """
    
    if not customer_id:
        return None
    
    try:
        subscriptions = stripe.Subscription.list(
            customer=customer_id,
            status="all",
            limit=1
        )
        
        if not subscriptions.data:
            return None
        
        sub = subscriptions.data[0]
        current_period_end = datetime.fromtimestamp(sub.current_period_end)
        
        return {
            "subscription_id": sub.id,
            "status": sub.status,
            "current_period_end": current_period_end.isoformat(),
            "cancel_at_period_end": sub.cancel_at_period_end,
            "plan_interval": sub.items.data[0].price.recurring.interval if sub.items.data else None
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Error fetching subscription: {e}")
        return None
