#!/bin/bash

# Webhook Testing Script for Production
# Run this after deploying to test your webhook endpoint

DOMAIN="https://yourdomain.com"  # UPDATE THIS!
WEBHOOK_URL="${DOMAIN}/api/stripe-webhook"

echo "🧪 Testing Webhook Endpoint: ${WEBHOOK_URL}"
echo "=================================="

# Test 1: Check if endpoint is accessible
echo "📡 Testing endpoint accessibility..."
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "${WEBHOOK_URL}")

if [ "$RESPONSE" = "405" ]; then
    echo "✅ Endpoint accessible (405 Method Not Allowed is expected for GET)"
elif [ "$RESPONSE" = "400" ]; then
    echo "✅ Endpoint accessible (400 Bad Request is expected for invalid POST)"
else
    echo "❌ Unexpected response: $RESPONSE"
    echo "🔍 Check your deployment and try again"
    exit 1
fi

# Test 2: Check if webhook accepts POST requests
echo "📬 Testing POST request handling..."
POST_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${WEBHOOK_URL}" \
    -H "Content-Type: application/json" \
    -d '{"test": "data"}')

if [ "$POST_RESPONSE" = "400" ]; then
    echo "✅ Webhook accepts POST requests (400 is expected for invalid signature)"
else
    echo "⚠️  Unexpected POST response: $POST_RESPONSE"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. Update Stripe webhook URL to: ${WEBHOOK_URL}"
echo "2. Test with a real payment"
echo "3. Monitor webhook logs in Vercel Functions tab"
echo ""
echo "📋 Stripe Webhook Configuration:"
echo "   URL: ${WEBHOOK_URL}"
echo "   Events: checkout.session.completed, invoice.payment_succeeded"
echo "   Method: POST"
