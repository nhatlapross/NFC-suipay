#!/bin/bash

echo "🚀 MERCHANT API ENDPOINTS TEST SUITE"
echo "===================================="
echo ""

BASE_URL="http://localhost:3000/api/merchants"
EMAIL="test-merchant-$(date +%s)@example.com"

echo "🧪 Test 1: Merchant Registration"
echo "================================="

REGISTRATION_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantName": "Test Coffee Shop",
    "businessType": "Food & Beverage",
    "email": "'$EMAIL'",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Test Street",
      "city": "San Francisco",
      "state": "CA",
      "country": "USA",
      "postalCode": "94105"
    },
    "walletAddress": "0x1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef",
    "webhookUrl": "https://webhook.example.com/test"
  }')

echo "Response: $REGISTRATION_RESPONSE"
echo ""

# Extract merchant data (requires jq for JSON parsing)
if command -v jq &> /dev/null; then
  MERCHANT_ID=$(echo $REGISTRATION_RESPONSE | jq -r '.data.merchantId // empty')
  PUBLIC_KEY=$(echo $REGISTRATION_RESPONSE | jq -r '.data.apiKeys.publicKey // empty')
  SECRET_KEY=$(echo $REGISTRATION_RESPONSE | jq -r '.data.apiKeys.secretKey // empty')
  
  if [[ -n "$MERCHANT_ID" && -n "$PUBLIC_KEY" && -n "$SECRET_KEY" ]]; then
    echo "✅ Registration successful!"
    echo "🆔 Merchant ID: $MERCHANT_ID"
    echo "🔑 Public Key: $PUBLIC_KEY"
    echo ""
    
    # Test 2: Public Merchant Info
    echo "🧪 Test 2: Get Public Merchant Info"
    echo "==================================="
    
    PUBLIC_INFO_RESPONSE=$(curl -s -X GET "$BASE_URL/public/$MERCHANT_ID")
    echo "Response: $PUBLIC_INFO_RESPONSE"
    echo ""
    
    # Test 3: Authenticated Profile Request
    echo "🧪 Test 3: Get Merchant Profile (Authenticated)"
    echo "==============================================="
    
    AUTH_HEADER="Authorization: Bearer $PUBLIC_KEY:$SECRET_KEY"
    PROFILE_RESPONSE=$(curl -s -X GET "$BASE_URL/profile" -H "$AUTH_HEADER")
    echo "Response: $PROFILE_RESPONSE"
    echo ""
    
    # Test 4: Profile Update
    echo "🧪 Test 4: Update Merchant Profile"
    echo "=================================="
    
    UPDATE_RESPONSE=$(curl -s -X PUT "$BASE_URL/profile" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d '{
        "merchantName": "Updated Test Coffee Shop",
        "phoneNumber": "+1234567891"
      }')
    echo "Response: $UPDATE_RESPONSE"
    echo ""
    
    # Test 5: Get Payment Stats
    echo "🧪 Test 5: Get Payment Stats"
    echo "============================"
    
    STATS_RESPONSE=$(curl -s -X GET "$BASE_URL/payments/stats" -H "$AUTH_HEADER")
    echo "Response: $STATS_RESPONSE"
    echo ""
    
    # Test 6: Get Settings
    echo "🧪 Test 6: Get Merchant Settings"
    echo "================================"
    
    SETTINGS_RESPONSE=$(curl -s -X GET "$BASE_URL/settings" -H "$AUTH_HEADER")
    echo "Response: $SETTINGS_RESPONSE"
    echo ""
    
    # Test 7: Create Webhook
    echo "🧪 Test 7: Create Webhook"
    echo "========================="
    
    WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/webhooks" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d '{
        "url": "https://test-webhook.example.com/webhook",
        "events": ["payment.completed", "payment.failed"],
        "description": "Test webhook"
      }')
    echo "Response: $WEBHOOK_RESPONSE"
    echo ""
    
    # Test 8: Get Webhooks
    echo "🧪 Test 8: Get Webhooks"
    echo "======================"
    
    GET_WEBHOOKS_RESPONSE=$(curl -s -X GET "$BASE_URL/webhooks" -H "$AUTH_HEADER")
    echo "Response: $GET_WEBHOOKS_RESPONSE"
    echo ""
    
    # Test 9: Create API Key
    echo "🧪 Test 9: Create API Key"
    echo "========================="
    
    API_KEY_RESPONSE=$(curl -s -X POST "$BASE_URL/api-keys" \
      -H "$AUTH_HEADER" \
      -H "Content-Type: application/json" \
      -d '{
        "name": "Test Development Key",
        "permissions": ["payments.read", "profile.read"],
        "expiresIn": 30
      }')
    echo "Response: $API_KEY_RESPONSE"
    echo ""
    
    # Test 10: Get API Keys
    echo "🧪 Test 10: Get API Keys"
    echo "========================"
    
    GET_API_KEYS_RESPONSE=$(curl -s -X GET "$BASE_URL/api-keys" -H "$AUTH_HEADER")
    echo "Response: $GET_API_KEYS_RESPONSE"
    echo ""
    
  else
    echo "❌ Registration failed or response invalid"
  fi
else
  echo "ℹ️  jq not available - showing raw registration response only"
fi

# Test 11: Invalid Authentication
echo "🧪 Test 11: Invalid Authentication"
echo "=================================="

INVALID_AUTH_RESPONSE=$(curl -s -X GET "$BASE_URL/profile" \
  -H "Authorization: Bearer invalid:credentials")
echo "Response: $INVALID_AUTH_RESPONSE"
echo ""

# Test 12: Validation Error
echo "🧪 Test 12: Validation Error"
echo "============================"

VALIDATION_ERROR_RESPONSE=$(curl -s -X POST "$BASE_URL/register" \
  -H "Content-Type: application/json" \
  -d '{
    "merchantName": "",
    "businessType": "Test"
  }')
echo "Response: $VALIDATION_ERROR_RESPONSE"
echo ""

echo "🎉 All tests completed!"
echo "======================="