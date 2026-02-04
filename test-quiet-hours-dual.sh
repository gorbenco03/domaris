#!/bin/bash

# =================================================================
# RIVA - Sprint 1 QUIET HOURS DUAL DEVICE TEST
# Testează quiet hours pe 2 conturi diferite
# =================================================================

echo "🎯 RIVA - QUIET HOURS DUAL DEVICE TEST"
echo "====================================="

API_URL="http://localhost:4000/api"

# Cont 1 - Device 1 (cu quiet hours)
EMAIL1="andrei.gorbenco@gmail.com"
PASSWORD1="Ambasador2052!"
TOKEN1="ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]"

# Cont 2 - Device 2 (fără quiet hours)
EMAIL2="chiril.gorbenco@gmail.com"
PASSWORD2="Ambasador2052!"
TOKEN2="ExponentPushToken[DYWq8SBvkI6-4zXqDrvSWr]"

echo ""
echo "📋 1. LOGIN CONT 1 (andrei.gorbenco@gmail.com)"
echo "============================================="

LOGIN1_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"$PASSWORD1\"}")

ACCESS_TOKEN1=$(echo "$LOGIN1_RESPONSE" | jq -r '.accessToken' 2>/dev/null)
USER1_ID=$(echo "$LOGIN1_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ "$ACCESS_TOKEN1" = "null" ] || [ -z "$ACCESS_TOKEN1" ]; then
  echo "❌ Login cont 1 failed"
  exit 1
fi

echo "✅ Login cont 1 successful - User ID: $USER1_ID"

echo ""
echo "📋 2. LOGIN CONT 2 (chiril.gorbenco@gmail.com)"
echo "=============================================="

LOGIN2_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD2\"}")

ACCESS_TOKEN2=$(echo "$LOGIN2_RESPONSE" | jq -r '.accessToken' 2>/dev/null)
USER2_ID=$(echo "$LOGIN2_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ "$ACCESS_TOKEN2" = "null" ] || [ -z "$ACCESS_TOKEN2" ]; then
  echo "❌ Login cont 2 failed"
  exit 1
fi

echo "✅ Login cont 2 successful - User ID: $USER2_ID"

echo ""
echo "📋 3. REGISTER PUSH TOKENS"
echo "=========================="

# Register token cont 1
REGISTER1_RESPONSE=$(curl -s -X POST "$API_URL/devices/push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN1'",
    "platform": "ios",
    "deviceId": "device-andrei-123"
  }')

echo "📱 Cont 1 token registration:"
echo "$REGISTER1_RESPONSE" | jq '.' 2>/dev/null

# Register token cont 2
REGISTER2_RESPONSE=$(curl -s -X POST "$API_URL/devices/push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN2'",
    "platform": "ios",
    "deviceId": "device-chiril-456"
  }')

echo "📱 Cont 2 token registration:"
echo "$REGISTER2_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 4. SETARE QUIET HOURS CONT 1 (22:00 - 08:00)"
echo "=============================================="

QUIET1_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "start": "22:00",
    "end": "08:00"
  }')

echo "🌙 Quiet hours cont 1:"
echo "$QUIET1_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 5. DEZACTIVARE QUIET HOURS CONT 2"
echo "=================================="

NOTIFICATIONS2_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "sms": true,
    "push": true,
    "email": true,
    "quietHoursEnabled": false
  }')

echo "🔔 Notificări cont 2 (fără quiet hours):"
echo "$NOTIFICATIONS2_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 6. VERIFICARE STARE FINALĂ"
echo "=========================="

echo "🔍 Cont 1 (cu quiet hours):"
FINAL1_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN1")
echo "  Quiet hours: $(echo "$FINAL1_RESPONSE" | jq -r '.notificationQuietHoursStart') - $(echo "$FINAL1_RESPONSE" | jq -r '.notificationQuietHoursEnd')"
echo "  Quiet enabled: $(echo "$FINAL1_RESPONSE" | jq -r '.notificationPreferences.quietHoursEnabled')"

echo ""
echo "🔍 Cont 2 (fără quiet hours):"
FINAL2_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN2")
echo "  Quiet hours: $(echo "$FINAL2_RESPONSE" | jq -r '.notificationQuietHoursStart') - $(echo "$FINAL2_RESPONSE" | jq -r '.notificationQuietHoursEnd')"
echo "  Quiet enabled: $(echo "$FINAL2_RESPONSE" | jq -r '.notificationPreferences.quietHoursEnabled')"

echo ""
echo "📋 7. TEST NOTIFICĂRI SECURIZATE"
echo "=============================="

echo "📱 Trimit notificare către CONT 1 (ar trebui să fie BLOCATĂ în quiet hours):"
SECURE1_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🌙 QUIET HOURS TEST",
    "message": "Cont 1 - Aceasta notificare ar trebui BLOCATĂ (22:00-08:00)"
  }')

echo "Răspuns cont 1:"
echo "$SECURE1_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📱 Trimit notificare către CONT 2 (ar trebui să PRIMESC):"
SECURE2_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🔔 NO QUIET HOURS",
    "message": "Cont 2 - Aceasta notificare ar trebui PRIMITĂ"
  }')

echo "Răspuns cont 2:"
echo "$SECURE2_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 8. TEST DIRECT EXPO API (fără backend)"
echo "======================================="

echo "📱 Test direct CONT 1 (quiet hours):"
DIRECT1_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$TOKEN1'",
    "title": "🌙 DIRECT QUIET TEST",
    "message": "Cont 1 - Test direct (ar trebui să primească)"
  }')

echo "Direct cont 1:"
echo "$DIRECT1_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📱 Test direct CONT 2 (fără quiet hours):"
DIRECT2_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$TOKEN2'",
    "title": "🔔 DIRECT NO QUIET",
    "message": "Cont 2 - Test direct (ar trebui să primească)"
  }')

echo "Direct cont 2:"
echo "$DIRECT2_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "🎯 REZULTATE AȘTEPTATE:"
echo "======================"
echo "📱 Device 1 (andrei):"
echo "  ✅ Backend secure: BLOCAT (quiet hours active)"
echo "  ✅ Direct Expo: PRIMITĂ (bypass quiet hours)"
echo ""
echo "📱 Device 2 (chiril):"
echo "  ✅ Backend secure: PRIMITĂ (fără quiet hours)"
echo "  ✅ Direct Expo: PRIMITĂ (fără quiet hours)"
echo ""
echo "🔍 Verifică pe telefoane:"
echo "  - Device 1: Ar trebui să primească DOAR notificarea directă"
echo "  - Device 2: Ar trebui să primească AMBELE notificări"
echo ""
echo "🌙 Ora curentă: $(date '+%H:%M:%S')"
echo "📊 Quiet hours active: 22:00 - 08:00"
echo ""
echo "TEST COMPLET! Verifică notificările pe ambele device-uri."
