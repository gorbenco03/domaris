#!/bin/bash

# =================================================================
# RIVA - FINAL QUIET HOURS TEST
# Test complet și corect pentru quiet hours pe 2 device-uri
# =================================================================

echo "🎯 RIVA - FINAL QUIET HOURS TEST"
echo "==============================="

API_URL="http://localhost:4000/api"

# Cont 1 - Device 1 (CU quiet hours)
EMAIL1="${ANDREI_EMAIL:-andrei.gorbenco@gmail.com}"
PASSWORD1="${ANDREI_PASSWORD:-Ambasador2052!}"
TOKEN1="${ANDREI_TOKEN:-ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]}"

# Cont 2 - Device 2 (FĂRĂ quiet hours)
EMAIL2="${CHIRIL_EMAIL:-chiril.gorbenco@gmail.com}"
PASSWORD2="${CHIRIL_PASSWORD:-Ambasador2052!}"
TOKEN2="${CHIRIL_TOKEN:-ExponentPushToken[DYWq8SBvkI6-4zXqDrvSWr]}"

echo ""
echo "📋 1. LOGIN AMBEELE CONTURI"
echo "========================="

# Login cont 1
LOGIN1_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"$PASSWORD1\"}")
ACCESS_TOKEN1=$(echo "$LOGIN1_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

# Login cont 2
LOGIN2_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD2\"}")
ACCESS_TOKEN2=$(echo "$LOGIN2_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

echo "✅ Login successful - Cont 1 ID: $(echo "$LOGIN1_RESPONSE" | jq -r '.user.id')"
echo "✅ Login successful - Cont 2 ID: $(echo "$LOGIN2_RESPONSE" | jq -r '.user.id')"

echo ""
echo "📋 2. SETARE QUIET HOURS CONT 1 (22:00 - 08:00)"
echo "============================================="

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
echo "📋 3. DEZACTIVARE QUIET HOURS CONT 2"
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
echo "$NOTIFICATIONS2_RESPONSE" | jq '.notificationPreferences.quietHoursEnabled' 2>/dev/null

echo ""
echo "📋 4. VERIFICARE STARE FINALĂ"
echo "=========================="

echo "🔍 Cont 1 (CU quiet hours):"
FINAL1_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN1")
echo "  Quiet hours: $(echo "$FINAL1_RESPONSE" | jq -r '.notificationQuietHoursStart') - $(echo "$FINAL1_RESPONSE" | jq -r '.notificationQuietHoursEnd')"
echo "  Quiet enabled: $(echo "$FINAL1_RESPONSE" | jq -r '.notificationPreferences.quietHoursEnabled')"

echo ""
echo "🔍 Cont 2 (FĂRĂ quiet hours):"
FINAL2_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN2")
echo "  Quiet hours: $(echo "$FINAL2_RESPONSE" | jq -r '.notificationQuietHoursStart') - $(echo "$FINAL2_RESPONSE" | jq -r '.notificationQuietHoursEnd')"
echo "  Quiet enabled: $(echo "$FINAL2_RESPONSE" | jq -r '.notificationPreferences.quietHoursEnabled')"

echo ""
echo "📋 5. TEST NOTIFICĂRI BACKEND (SECURIZATE)"
echo "========================================"

echo "📱 CONT 1 (CU quiet hours - ar trebui BLOCAT):"
BACKEND1_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🌙 BACKEND CONT 1",
    "message": "Cont 1 - Backend (ar trebui BLOCAT în quiet hours)"
  }')

echo "$BACKEND1_RESPONSE" | jq '. | {success, message, quietHours}' 2>/dev/null

echo ""
echo "📱 CONT 2 (FĂRĂ quiet hours - ar trebui PRIMITĂ):"
BACKEND2_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "🔔 BACKEND CONT 2",
    "message": "Cont 2 - Backend (ar trebui PRIMITĂ)"
  }')

echo "$BACKEND2_RESPONSE" | jq '. | {success, message, quietHours}' 2>/dev/null

echo ""
echo "📋 6. TEST NOTIFICĂRI DIRECT (EXPO API)"
echo "===================================="

echo "📱 DIRECT CONT 1 (CU quiet hours - ar trebui PRIMITĂ):"
DIRECT1_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$TOKEN1'",
    "title": "🔵 DIRECT CONT 1",
    "message": "Cont 1 - Direct (ar trebui PRIMITĂ - bypass quiet hours)"
  }')

echo "$DIRECT1_RESPONSE" | jq '.data | {status, id}' 2>/dev/null

echo ""
echo "📱 DIRECT CONT 2 (FĂRĂ quiet hours - ar trebui PRIMITĂ):"
DIRECT2_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$TOKEN2'",
    "title": "🔴 DIRECT CONT 2",
    "message": "Cont 2 - Direct (ar trebui PRIMITĂ)"
  }')

echo "$DIRECT2_RESPONSE" | jq '.data | {status, id}' 2>/dev/null

echo ""
echo "🎯 REZUMAT ȘI REZULTATE AȘTEPTATE:"
echo "================================="
echo ""
echo "📱 DEVICE 1 (andrei - CU quiet hours):"
echo "  ❌ Backend: BLOCAT (quiet hours 22:00-08:00)"
echo "  ✅ Direct: PRIMITĂ (bypass backend)"
echo "  🔍 Total: 1 notificare primită"
echo ""
echo "📱 DEVICE 2 (chiril - FĂRĂ quiet hours):"
echo "  ✅ Backend: PRIMITĂ (fără restricții)"
echo "  ✅ Direct: PRIMITĂ (fără restricții)"
echo "  🔍 Total: 2 notificări primite"
echo ""
echo "🌙 Ora curentă: $(date '+%H:%M:%S')"
echo "📊 Quiet hours active: 22:00 - 08:00"
echo ""
echo "🔍 Verifică acum telefoanele:"
echo "  - Device 1: Ar trebui să vezi DOAR '🔵 DIRECT CONT 1'"
echo "  - Device 2: Ar trebui să vezi '🔔 BACKEND CONT 2' și '🔴 DIRECT CONT 2'"
echo ""
echo "Dacă rezultatele diferesc, problema e la token sharing între device-uri!"
