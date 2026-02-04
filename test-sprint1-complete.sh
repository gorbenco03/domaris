#!/bin/bash

# =================================================================
# RIVA - Sprint 1 COMPLETE TEST SCRIPT
# Testează TOATE funcționalitățile implementate:
# - Login și autentificare
# - Profile update cu câmpuri noi
# - Notification preferences cu SMS/quiet hours
# - Push notifications
# - Validare date salvate
# =================================================================

echo "🚀 RIVA Sprint 1 - COMPLETE TEST SUITE"
echo "======================================"

# API URL
API_URL="http://localhost:4000/api"

# Credențiale
EMAIL="chiril.gorbenco@gmail.com"
PASSWORD="Ambasador2052!"

# Push token (din app)
PUSH_TOKEN="ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]"

echo ""
echo "📋 1. 🔐 TEST AUTENTIFICARE"
echo "=========================="

LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed"
  exit 1
fi

echo "✅ Login successful"
echo "📤 User ID: $(echo "$LOGIN_RESPONSE" | jq -r '.user.id' 2>/dev/null)"

echo ""
echo "📋 2. 📊 TEST GET PROFILE BASELINE"
echo "===============================""

GET_PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "📤 Current profile data:"
echo "$GET_PROFILE_RESPONSE" | jq '. | {id, email, firstName, lastName, bio, address, city, country, postalCode, phone, socialLinks}' 2>/dev/null

echo ""
echo "📋 3. TEST UPDATE PROFILE (câmpuri noi Sprint 1)"
echo "==============================================="

UPDATE_PROFILE_DATA='{
  "firstName": "Gorbenco",
  "lastName": "Chiril",
  "bio": "Sprint 1 Test Bio - Actualizat la '$(date '+%H:%M:%S')'",
  "address": "Strada Testului 123",
  "city": "București",
  "country": "România",
  "postalCode": "010123",
  "socialLinks": {
    "instagram": "https://instagram.com/test_riva",
    "linkedin": "https://linkedin.com/in/test_riva",
    "facebook": "https://facebook.com/test_riva"
  }
}'

UPDATE_PROFILE_RESPONSE=$(curl -s -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$UPDATE_PROFILE_DATA")

echo "📤 Update profile response:"
echo "$UPDATE_PROFILE_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 4. TEST UPDATE NOTIFICATION PREFERENCES"
echo "=========================================="

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

echo "📤 Update notifications response:"
echo "$NOTIFICATIONS_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 5. ⏰ TEST UPDATE QUIET HOURS"
echo "============================"

QUIET_HOURS_DATA='{
  "start": "23:00",
  "end": "07:00"
}'

QUIET_HOURS_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$QUIET_HOURS_DATA")

echo "📤 Update quiet hours response:"
echo "$QUIET_HOURS_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 6. 📱 TEST PUSH NOTIFICATION"
echo "============================"

PUSH_RESPONSE=$(curl -s -X POST https://api.expo.dev/v2/push/send \
  -H "Content-Type: application/json" \
  -d '{
    "to": "'$PUSH_TOKEN'",
    "title": "🎯 Sprint 1 Test",
    "body": "Testare completă Sprint 1 - Profile & Notifications",
    "data": {"type": "sprint1_test", "timestamp": "'$(date +%s)'"}
  }')

echo "📤 Push notification response:"
echo "$PUSH_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 7. 🔍 VERIFICARE FINALĂ - TOATE DATELE"
echo "====================================="

FINAL_PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN")

echo "📤 Final profile verification:"
echo "$FINAL_PROFILE_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 8. ✅ VALIDARE AUTOMATĂ"
echo "========================"

# Extrage date pentru validare
BIO=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.bio' 2>/dev/null)
ADDRESS=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.address' 2>/dev/null)
CITY=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.city' 2>/dev/null)
COUNTRY=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.country' 2>/dev/null)
POSTAL=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.postalCode' 2>/dev/null)
SMS_ENABLED=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationPreferences.sms' 2>/dev/null)
QUIET_ENABLED=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationPreferences.quietHoursEnabled' 2>/dev/null)
QUIET_START=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationQuietHoursStart' 2>/dev/null)
QUIET_END=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationQuietHoursEnd' 2>/dev/null)
PUSH_STATUS=$(echo "$PUSH_RESPONSE" | jq -r '.data.status' 2>/dev/null)

echo "🔍 Validări Sprint 1:"
echo "  ✅ Bio conține 'Sprint 1 Test': $(echo "$BIO" | grep -q "Sprint 1 Test" && echo "DA" || echo "NU")"
echo "  ✅ Address: 'Strada Testului 123': $(echo "$ADDRESS" | grep -q "Strada Testului 123" && echo "DA" || echo "NU")"
echo "  ✅ City: 'București': $(echo "$CITY" | grep -q "București" && echo "DA" || echo "NU")"
echo "  ✅ Country: 'România': $(echo "$COUNTRY" | grep -q "România" && echo "DA" || echo "NU")"
echo "  ✅ Postal Code: '010123': $(echo "$POSTAL" | grep -q "010123" && echo "DA" || echo "NU")"
echo "  ✅ SMS enabled: $(echo "$SMS_ENABLED" | grep -q "true" && echo "DA" || echo "NU")"
echo "  ✅ Quiet hours enabled: $(echo "$QUIET_ENABLED" | grep -q "true" && echo "DA" || echo "NU")"
echo "  ✅ Quiet hours start: '23:00:00': $(echo "$QUIET_START" | grep -q "23:00" && echo "DA" || echo "NU")"
echo "  ✅ Quiet hours end: '08:00:00': $(echo "$QUIET_END" | grep -q "08:00" && echo "DA" || echo "NU")"
echo "  ✅ Push notification status: '$PUSH_STATUS': $(echo "$PUSH_STATUS" | grep -q "ok" && echo "DA" || echo "NU")"

echo ""
echo "📋 9. 🔄 TEST EDGE CASES"
echo "======================"

echo "🔸 Test quiet hours invalid (start > end):"
INVALID_QUIET='{"start":"23:00","end":"06:00"}'
INVALID_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_QUIET")
echo "Status: $(echo "$INVALID_RESPONSE" | jq -r '.statusCode // "Success"' 2>/dev/null)"

echo ""
echo "🔸 Test social links invalid:"
INVALID_SOCIAL='{
  "socialLinks": {
    "instagram": "invalid-url",
    "linkedin": "also-invalid"
  }
}'
INVALID_SOCIAL_RESPONSE=$(curl -s -X PUT "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_SOCIAL")
echo "Status: $(echo "$INVALID_SOCIAL_RESPONSE" | jq -r '.statusCode // "Success"' 2>/dev/null)"

echo ""
echo "🎉 SPRINT 1 - TESTARE COMPLETĂ!"
echo "=============================="

# Calculăm scorul de succes
TOTAL_TESTS=10
PASSED_TESTS=0

[ "$(echo "$BIO" | grep -q "Sprint 1 Test" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$ADDRESS" | grep -q "Strada Testului 123" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$CITY" | grep -q "București" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$COUNTRY" | grep -q "România" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$POSTAL" | grep -q "010123" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$SMS_ENABLED" | grep -q "true" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$QUIET_ENABLED" | grep -q "true" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$QUIET_START" | grep -q "23:00" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$QUIET_END" | grep -q "08:00" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))
[ "$(echo "$PUSH_STATUS" | grep -q "ok" && echo "1" || echo "0")" = "1" ] && ((PASSED_TESTS++))

SUCCESS_RATE=$((PASSED_TESTS * 100 / TOTAL_TESTS))

echo "📊 Scor testare: $PASSED_TESTS/$TOTAL_TESTS ($SUCCESS_RATE%)"
echo ""
echo "✅ Funcționalități testate:"
echo "   🔐 Autentificare și login"
echo "   ✏️ Profile update (bio, address, city, country, postalCode, socialLinks)"
echo "   🔔 Notification preferences (SMS, push, email, quiet hours)"
echo "   ⏰ Quiet hours configuration"
echo "   📱 Push notifications"
echo "   🔄 Edge cases și validare"
echo ""
echo "📱 Verificare în app:"
echo "   1. Deschide tab-ul Profil"
echo "   2. Verifică datele afișate (nume, locație, adresă)"
echo "   3. Apasă 'Editează' → test ProfileEditScreen"
echo "   4. Apasă 'Setări Notificări' → test NotificationSettingsScreen"
echo "   5. Verifică notificarea primită pe telefon"
echo ""
echo "🚀 Sprint 1 - Extended Profile Editing & Functional Notification Settings"
echo "   Status: $(if [ $SUCCESS_RATE -eq 100 ]; then echo "✅ COMPLET ȘI FUNCȚIONAL"; else echo "⚠️ Parțial funcțional ($SUCCESS_RATE%)"; fi)"
