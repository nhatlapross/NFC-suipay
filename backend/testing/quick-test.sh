#!/bin/bash

# Quick MY_COIN test script
# Run this to test MY_COIN sending

echo "==================================="
echo "    Quick MY_COIN Test"
echo "==================================="

# Step 1: Login
echo -e "\n1. Logging in..."
echo "Command: curl -X POST http://localhost:8080/api/auth/login"

RESPONSE=$(curl -s -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }')

echo "Response:"
echo $RESPONSE | python -m json.tool 2>/dev/null || echo $RESPONSE

# Extract token (works on Windows Git Bash too)
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo -e "\n❌ Failed to get token. Please check login credentials."
  echo "Update email and password in this script"
  exit 1
fi

echo -e "\n✅ Got token: ${TOKEN:0:30}..."

# Step 2: Check balance
echo -e "\n2. Checking MY_COIN balance..."
echo "Command: curl -X GET http://localhost:8080/api/payments/mycoin/balance"

curl -s -X GET http://localhost:8080/api/payments/mycoin/balance \
  -H "Authorization: Bearer $TOKEN" | python -m json.tool 2>/dev/null

# Step 3: Test payment
echo -e "\n3. Testing MY_COIN payment..."
echo "Sending 0.01 MY_COIN to test address"
echo "Command: curl -X POST http://localhost:8080/api/payments/mycoin/test-payment"

PAYMENT_RESPONSE=$(curl -s -X POST http://localhost:8080/api/payments/mycoin/test-payment \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "recipientAddress": "0x7b8e0864967427679b4e129f79dc332a885c6087ec9e187b53451a9006ee15f2",
    "amount": 0.01
  }')

echo -e "\nPayment response:"
echo $PAYMENT_RESPONSE | python -m json.tool 2>/dev/null || echo $PAYMENT_RESPONSE

# Check success
if echo $PAYMENT_RESPONSE | grep -q '"success":true'; then
  echo -e "\n✅ Payment successful!"
else
  echo -e "\n❌ Payment failed. Check error message above."
fi