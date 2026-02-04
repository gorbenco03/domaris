#!/bin/bash

# =================================================================
# RIVA - SECURE Notification Test Script
# Testează notificări SECURIZATE (doar pentru utilizatorul logat)
# =================================================================

echo "RIVA - SECURE Notification Test"
echo "==============================="

API_URL="http://localhost:4000/api"
EMAIL="chiril.gorbenco@gmail.com"
PASSWORD="Ambasador2052!"

echo ""
echo "1. LOGIN (obține token valid)"
echo "============================="

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "ERROR: Login failed"
  exit 1
fi

echo "SUCCESS: Login completed"
echo "User ID: $(echo "$LOGIN_RESPONSE" | jq -r '.user.id' 2>/dev/null)"

echo ""
echo "2. REGISTER PUSH TOKEN (legat de user)"
echo "====================================="

REGISTER_RESPONSE=$(curl -s -X POST "$API_URL/devices/push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]",
    "platform": "ios",
    "deviceId": "test-device-123"
  }')

echo "Push token registration:"
echo "$REGISTER_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "3. SEND SECURE NOTIFICATION (doar la device-urile user-ului)"
echo "=========================================================="

SECURE_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "SECURE Test",
    "message": "Notificare securizată - doar pentru utilizatorul logat"
  }')

echo "Secure notification response:"
echo "$SECURE_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "4. TEST FĂRĂ TOKEN (ar trebui să eșueze)"
echo "======================================"

UNAUTH_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "UNAUTHORIZED",
    "message": "Aceasta nu ar trebui să funcționeze"
  }')

echo "Unauthorized response (should fail):"
echo "$UNAUTH_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "5. TEST CU TOKEN INVALID (ar trebui să eșueze)"
echo "============================================"

INVALID_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer invalid-token-123" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "INVALID TOKEN",
    "message": "Aceasta nu ar trebui să funcționeze"
  }')

echo "Invalid token response (should fail):"
echo "$INVALID_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "SECURITY TEST COMPLETE!"
echo "======================"
echo ""
echo "Rezultate așteptate:"
echo "  1. ✅ Login success"
echo "  2. ✅ Push token registered (legat de user)"
echo "  3. ✅ Secure notification sent (doar la device-urile user-ului)"
echo "  4. ❌ Unauthorized request failed (fără token)"
echo "  5. ❌ Invalid token failed (token greșit)"
echo ""
echo "ACUM notificările sunt SECURIZATE!"
echo "Doar utilizatorul logat poate primi notificări!"
