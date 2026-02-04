#!/bin/bash

# =================================================================
# RIVA - Sprint 1 Simple Test Script
# =================================================================

echo "RIVA Sprint 1 - TEST SUITE"
echo "========================="

API_URL="http://localhost:4000/api"
EMAIL="chiril.gorbenco@gmail.com"
PASSWORD="Ambasador2052!"
PUSH_TOKEN="ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]"

echo ""
echo "1. LOGIN TEST"
echo "============="

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
echo "2. PROFILE UPDATE TEST"
echo "====================="

UPDATE_DATA='{
  "firstName": "Gorbenco",
  "lastName": "Chiril",
  "bio": "Sprint 1 Test Bio - '$(date +%H:%M:%S)'",
  "address": "Strada Testului 123",
  "city": "Bucuresti",
  "country": "România",
  "postalCode": "010123",
  "socialLinks": {
    "instagram": "https://instagram.com/test_riva",
    "linkedin": "https://linkedin.com/in/test_riva"
  }
}'

UPDATE_RESPONSE=$(curl -s -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_DATA")

echo "Profile update response:"
echo "$UPDATE_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "3. NOTIFICATION PREFERENCES TEST"
echo "==============================="

NOTIFICATIONS_DATA='{
  "sms": true,
  "push": true,
  "email": true,
  "marketing": false,
  "priceDrops": true,
  "newMessages": true,
  "viewingReminders": true,
  "newListingsAlerts": true,
  "quietHoursEnabled": true
}'

NOTIFICATIONS_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NOTIFICATIONS_DATA")

echo "Notifications update response:"
echo "$NOTIFICATIONS_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "4. QUIET HOURS TEST"
echo "==================="

QUIET_HOURS_DATA='{
  "start": "23:00",
  "end": "07:00"
}'

QUIET_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$QUIET_HOURS_DATA")

echo "Quiet hours response:"
echo "$QUIET_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "5. PUSH NOTIFICATION TEST"
echo "========================"

PUSH_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$PUSH_TOKEN'",
    "title": "Sprint 1 Test",
    "body": "Testare completa Sprint 1",
    "data": {"type": "sprint1_test", "timestamp": "'$(date +%s)'"}
  }')

echo "Push notification response:"
echo "$PUSH_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "6. FINAL VERIFICATION"
echo "===================="

FINAL_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "Final profile data:"
echo "$FINAL_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "7. VALIDATION"
echo "============="

BIO=$(echo "$FINAL_RESPONSE" | jq -r '.bio' 2>/dev/null)
ADDRESS=$(echo "$FINAL_RESPONSE" | jq -r '.address' 2>/dev/null)
CITY=$(echo "$FINAL_RESPONSE" | jq -r '.city' 2>/dev/null)
SMS=$(echo "$FINAL_RESPONSE" | jq -r '.notificationPreferences.sms' 2>/dev/null)
QUIET_START=$(echo "$FINAL_RESPONSE" | jq -r '.notificationQuietHoursStart' 2>/dev/null)
PUSH_STATUS=$(echo "$PUSH_RESPONSE" | jq -r '.data.status' 2>/dev/null)

echo "Validation Results:"
echo "  Bio contains 'Sprint 1': $(echo "$BIO" | grep -q "Sprint 1" && echo "PASS" || echo "FAIL")"
echo "  Address: 'Strada Testului 123': $(echo "$ADDRESS" | grep -q "Strada Testului 123" && echo "PASS" || echo "FAIL")"
echo "  City: 'Bucuresti': $(echo "$CITY" | grep -q "Bucuresti" && echo "PASS" || echo "FAIL")"
echo "  SMS enabled: $(echo "$SMS" | grep -q "true" && echo "PASS" || echo "FAIL")"
echo "  Quiet hours start: '23:00:00': $(echo "$QUIET_START" | grep -q "23:00" && echo "PASS" || echo "FAIL")"
echo "  Push notification status: '$PUSH_STATUS': $(echo "$PUSH_STATUS" | grep -q "ok" && echo "PASS" || echo "FAIL")"

echo ""
echo "SPRINT 1 TEST COMPLETE!"
echo "======================"
echo "Check your phone for the push notification!"
echo "Check the mobile app for updated profile data!"
