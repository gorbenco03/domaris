#!/bin/bash

# =================================================================
# RIVA - Sprint 1 Notification Test Script
# Testează dacă quiet hours funcționează corect
# Trimite notificări test și verifică dacă sunt blocate
# =================================================================

echo "🔔 RIVA Sprint 1 - Notification Test Script"
echo "========================================="

# API URL
API_URL="http://localhost:4000/api"

# Credențiale
EMAIL="chiril.gorbenco@gmail.com"
PASSWORD="Ambasador2052!"

echo ""
echo "📋 1. LOGIN ȘI OBȚINERE TOKEN"
echo "============================="

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful - User ID: $USER_ID"

echo ""
echo "📋 2. VERIFICARE SETĂRI NOTIFICĂRI CURENTE"
echo "========================================"

CURRENT_SETTINGS=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "⏰ Quiet hours start: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationQuietHoursStart')"
echo "⏰ Quiet hours end: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationQuietHoursEnd')"
echo "🔔 SMS enabled: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationPreferences.sms')"
echo "🔔 Push enabled: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationPreferences.push')"
echo "🔔 Email enabled: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationPreferences.email')"
echo "🔫 Quiet hours enabled: $(echo "$CURRENT_SETTINGS" | jq -r '.notificationPreferences.quietHoursEnabled')"

echo ""
echo "📋 3. SETARE QUIET HOURS PERIOADĂ DE TEST"
echo "======================================"

# Verificăm ora curentă
CURRENT_HOUR=$(date +%H)
CURRENT_MINUTE=$(date +%M)

echo "🕐 Ora curentă: $CURRENT_HOUR:$CURRENT_MINUTE"

# Setăm quiet hours pentru a include ora curentă (test imediat)
if [ "$CURRENT_HOUR" -lt 12 ]; then
  # Dacă e dimineața, setăm quiet hours 00:00-23:59
  QUIET_START="00:00"
  QUIET_END="23:59"
  TEST_PERIOD="toată ziua"
else
  # Dacă e după-amiaza, setăm quiet hours 00:00-23:59
  QUIET_START="00:00"
  QUIET_END="23:59"
  TEST_PERIOD="toată ziua"
fi

echo "🔧 Setăm quiet hours: $QUIET_START - $QUIET_END ($TEST_PERIOD)"

# Activăm quiet hours
QUIET_HOURS_DATA="{\"start\":\"$QUIET_START\",\"end\":\"$QUIET_END\"}"
curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$QUIET_HOURS_DATA" > /dev/null

# Activăm quiet hours în preferences
NOTIFICATIONS_DATA='{
  "sms": true,
  "push": true,
  "email": true,
  "quietHoursEnabled": true
}'

curl -s -X PATCH "$API_URL/users/me/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NOTIFICATIONS_DATA" > /dev/null

echo "✅ Quiet hours activate pentru test"

echo ""
echo "📋 4. TRIMITERE NOTIFICĂRI TEST"
echo "============================"

echo "🔸 Trimit notificare SMS test..."
SMS_RESPONSE=$(curl -s -X POST "$API_URL/notifications/test/sms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test SMS - Sprint 1 Quiet Hours","userId":"'$USER_ID'"}')

echo "📤 SMS Response: $SMS_RESPONSE"

echo ""
echo "🔸 Trimit notificare PUSH test..."
PUSH_RESPONSE=$(curl -s -X POST "$API_URL/notifications/test/push" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Push","message":"Test Push - Sprint 1 Quiet Hours","userId":"'$USER_ID'"}')

echo "📤 Push Response: $PUSH_RESPONSE"

echo ""
echo "🔸 Trimit notificare EMAIL test..."
EMAIL_RESPONSE=$(curl -s -X POST "$API_URL/notifications/test/email" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test Email - Sprint 1","message":"Test Email - Quiet Hours active","userId":"'$USER_ID'"}')

echo "📤 Email Response: $EMAIL_RESPONSE"

echo ""
echo "📋 5. VERIFICARE LOG NOTIFICĂRI"
echo "============================="

echo "🔸 Verific log-urile de notificări trimise..."
LOGS_RESPONSE=$(curl -s -X GET "$API_URL/notifications/logs?userId=$USER_ID&limit=10" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "📋 Recent notification logs:"
echo "$LOGS_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGS_RESPONSE"

echo ""
echo "📋 6. TEST DEZACTIVARE QUIET HOURS"
echo "================================="

# Dezactivăm quiet hours
NOTIFICATIONS_DISABLED='{
  "sms": true,
  "push": true,
  "email": true,
  "quietHoursEnabled": false
}'

curl -s -X PATCH "$API_URL/users/me/notifications" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$NOTIFICATIONS_DISABLED" > /dev/null

echo "✅ Quiet hours dezactivate"

echo ""
echo "🔸 Trimit notificări după dezactivare quiet hours..."
echo "📧 Email test (ar trebui să primești):"
curl -s -X POST "$API_URL/notifications/test/email" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subject":"Test Email POST quiet hours","message":"Acum ar trebui să primești acest email","userId":"'$USER_ID'"}' > /dev/null

echo "📱 Push test (ar trebui să primești):"
curl -s -X POST "$API_URL/notifications/test/push" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test POST quiet hours","message":"Acum ar trebui să primești acest push","userId":"'$USER_ID'"}' > /dev/null

echo "📱 SMS test (ar trebui să primești):"
curl -s -X POST "$API_URL/notifications/test/sms" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message":"Test SMS POST quiet hours - ar trebui să primești","userId":"'$USER_ID'"}' > /dev/null

echo ""
echo "🎯 REZULTATE TEST"
echo "================"
echo "✅ Verifică email-ul tău (chiril.gorbenco@gmail.com)"
echo "✅ Verifică notificările push pe telefon"
echo "✅ Verifică SMS pe telefon"
echo ""
echo "📊 Tabel rezultate așteptate:"
echo "┌─────────────────┬──────────────────┬──────────────────┐"
echo "│ Tip Notificare  │ CU quiet hours   │ FĂRĂ quiet hours │"
echo "├─────────────────┼──────────────────┼──────────────────┤"
echo "│ Email           │ 🔒 BLOCATĂ       │ ✅ PRIMITĂ       │"
echo "│ Push            │ 🔒 BLOCATĂ       │ ✅ PRIMITĂ       │"
echo "│ SMS             │ 🔒 BLOCATĂ       │ ✅ PRIMITĂ       │"
echo "└─────────────────┴──────────────────┴──────────────────┘"
echo ""
echo "🔧 Dacă nu primești notificări deloc, verifică:"
echo "   - Backend server running pe http://localhost:4000"
echo "   - Serviciul de email/SMS configurat"
echo "   - Token push notification valid"
echo ""
echo "📱 Testează și în aplicația mobilă:"
echo "   - Tab Profil → Setări Notificări"
echo "   - Modifică quiet hours și verifică efectul"
