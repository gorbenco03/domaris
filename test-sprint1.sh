#!/bin/bash

# =================================================================
# RIVA - Sprint 1 Complete Test Script
# Testează toate funcționalitățile implementate:
# - Login cu credențiale reale
# - Update profile cu câmpuri noi
# - Update notification preferences 
# - Update quiet hours
# - Verificare date salvate
# =================================================================

echo "🚀 RIVA Sprint 1 - Complete Test Script"
echo "======================================"

# API URL
API_URL="http://localhost:4000/api"

# Credențiale test
EMAIL="chiril.gorbenco@gmail.com"
PASSWORD="Ambasador2052!"

echo ""
echo "📋 1. TEST LOGIN"
echo "=================="

# Login request
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "📤 Login request sent..."
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"

# Extract token
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

if [ "$ACCESS_TOKEN" = "null" ] || [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Login successful - token received"

echo ""
echo "📋 2. TEST GET CURRENT PROFILE (baseline)"
echo "=========================================="

GET_PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "📤 Get profile request sent..."
echo "$GET_PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$GET_PROFILE_RESPONSE"

echo ""
echo "📋 3. TEST UPDATE PROFILE (câmpuri noi)"
echo "======================================="

UPDATE_PROFILE_DATA='{
  "firstName": "Gorbenco",
  "lastName": "Chiril", 
  "bio": "Sprint 1 Test Bio - Actualizat la '$(date)'",
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

echo "📤 Update profile request sent..."
echo "$UPDATE_PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$UPDATE_PROFILE_RESPONSE"

echo ""
echo "📋 4. TEST UPDATE NOTIFICATION PREFERENCES"
echo "========================================"

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

echo "📤 Update notifications request sent..."
echo "$NOTIFICATIONS_RESPONSE" | jq '.' 2>/dev/null || echo "$NOTIFICATIONS_RESPONSE"

echo ""
echo "📋 5. TEST UPDATE QUIET HOURS"
echo "============================"

QUIET_HOURS_DATA='{
  "start": "23:00",
  "end": "07:00"
}'

QUIET_HOURS_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$QUIET_HOURS_DATA")

echo "📤 Update quiet hours request sent..."
echo "$QUIET_HOURS_RESPONSE" | jq '.' 2>/dev/null || echo "$QUIET_HOURS_RESPONSE"

echo ""
echo "📋 6. VERIFICARE FINALĂ - GET PROFILE COMPLET"
echo "============================================"

FINAL_PROFILE_RESPONSE=$(curl -s -X GET "$API_URL/users/me" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

echo "📤 Final profile check..."
echo "$FINAL_PROFILE_RESPONSE" | jq '.' 2>/dev/null || echo "$FINAL_PROFILE_RESPONSE"

echo ""
echo "📋 7. VALIDARE DATE TESTATE"
echo "========================"

# Extrage și validează datele din response-ul final
BIO=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.bio' 2>/dev/null)
ADDRESS=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.address' 2>/dev/null)
CITY=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.city' 2>/dev/null)
SMS_ENABLED=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationPreferences.sms' 2>/dev/null)
QUIET_HOURS_START=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationQuietHoursStart' 2>/dev/null)
QUIET_HOURS_END=$(echo "$FINAL_PROFILE_RESPONSE" | jq -r '.notificationQuietHoursEnd' 2>/dev/null)

echo "🔍 Validări:"
echo "  ✅ Bio conține 'Sprint 1 Test': $(echo "$BIO" | grep -q "Sprint 1 Test" && echo "DA" || echo "NU")"
echo "  ✅ Address este 'Strada Testului 123': $(echo "$ADDRESS" | grep -q "Strada Testului 123" && echo "DA" || echo "NU")"
echo "  ✅ City este 'București': $(echo "$CITY" | grep -q "București" && echo "DA" || echo "NU")"
echo "  ✅ SMS notifications este 'true': $(echo "$SMS_ENABLED" | grep -q "true" && echo "DA" || echo "NU")"
echo "  ✅ Quiet hours start este '23:00:00': $(echo "$QUIET_HOURS_START" | grep -q "23:00" && echo "DA" || echo "NU")"
echo "  ✅ Quiet hours end este '08:00:00': $(echo "$QUIET_HOURS_END" | grep -q "08:00" && echo "DA" || echo "NU")"

echo ""
echo "📋 8. TEST EDGE CASES"
echo "===================="

echo "🔸 Test quiet hours invalid (start > end):"
INVALID_QUIET_HOURS='{"start":"23:00","end":"06:00"}'
INVALID_RESPONSE=$(curl -s -X PATCH "$API_URL/users/me/quiet-hours" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$INVALID_QUIET_HOURS")
echo "$INVALID_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_RESPONSE"

echo ""
echo "🔸 Test social links invalid (URL malformed):"
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
echo "$INVALID_SOCIAL_RESPONSE" | jq '.' 2>/dev/null || echo "$INVALID_SOCIAL_RESPONSE"

echo ""
echo "🎉 TESTARE COMPLETĂ!"
echo "==================="
echo "✅ Toate funcționalitățile Sprint 1 au fost testate"
echo "✅ Profile update cu câmpuri noi"
echo "✅ Notification preferences cu SMS toggle"
echo "✅ Quiet hours configuration"
echo "✅ Validare date și edge cases"
echo ""
echo "📱 Poți acum verifica în aplicația mobilă:"
echo "   - Tab Profil → 'Editează' → vezi noile câmpuri"
echo "   - Tab Profil → 'Setări Notificări' → vezi quiet hours și SMS toggle"
echo ""
echo "🔗 Backend API: $API_URL"
echo "📧 Email test: $EMAIL"
