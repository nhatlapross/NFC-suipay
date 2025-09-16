#!/bin/bash

# Test MY_COIN sending with curl commands
# Update these variables with your test data

EMAIL="test@example.com"
PASSWORD="Test123!@#"
RECIPIENT="0x7b8e0864967427679b4e129f79dc332a885c6087ec9e187b53451a9006ee15f2"
AMOUNT=0.1
API_URL="http://localhost:8080/api"

echo "========================================="
echo "     MY_COIN Payment Test (curl)"
echo "========================================="

# Step 1: Login
echo -e "\n🔐 Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token using grep and sed
TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Response:"
  echo $LOGIN_RESPONSE | jq '.'
  exit 1
fi

echo "✅ Login successful"
echo "Token: ${TOKEN:0:20}..."

# Step 2: Check balance
echo -e "\n💰 Checking MY_COIN balance..."
BALANCE_RESPONSE=$(curl -s -X GET "$API_URL/payments/mycoin/balance" \
  -H "Authorization: Bearer $TOKEN")

echo "Balance response:"
echo $BALANCE_RESPONSE | jq '.'

# Step 3: Get MY_COIN objects
echo -e "\n📦 Getting MY_COIN objects..."
OBJECTS_RESPONSE=$(curl -s -X GET "$API_URL/payments/mycoin/objects" \
  -H "Authorization: Bearer $TOKEN")

echo "Objects response:"
echo $OBJECTS_RESPONSE | jq '.'

# Step 4: Test payment
echo -e "\n🚀 Sending MY_COIN payment..."
echo "To: $RECIPIENT"
echo "Amount: $AMOUNT MY_COIN"

PAYMENT_RESPONSE=$(curl -s -X POST "$API_URL/payments/mycoin/test-payment" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"recipientAddress\":\"$RECIPIENT\",\"amount\":$AMOUNT}")

echo -e "\nPayment response:"
echo $PAYMENT_RESPONSE | jq '.'

# Check if successful
if echo $PAYMENT_RESPONSE | grep -q '"success":true'; then
  echo -e "\n✅ Payment successful!"
  TX_HASH=$(echo $PAYMENT_RESPONSE | grep -o '"txHash":"[^"]*' | sed 's/"txHash":"//')
  echo "Transaction: $TX_HASH"
  echo "Explorer: https://suiscan.xyz/testnet/tx/$TX_HASH"
else
  echo -e "\n❌ Payment failed!"
fi