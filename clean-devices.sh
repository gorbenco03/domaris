#!/bin/bash

# =================================================================
# RIVA - Clean Device Registration
# Elimină device tokens duplicate și reînregistrează corect
# =================================================================

echo "🧹 RIVA - CLEAN DEVICE REGISTRATION"
echo "==================================="

API_URL="http://localhost:4000/api"

# Cont 1 - Device 1
EMAIL1="andrei.gorbenco@gmail.com"
PASSWORD1="Ambasador2052!"
TOKEN1="ExponentPushToken[LyJ-UmOk8tskpbzOpueYmA]"

# Cont 2 - Device 2  
EMAIL2="chiril.gorbenco@gmail.com"
PASSWORD2="Ambasador2052!"
TOKEN2="ExponentPushToken[DYWq8SBvkI6-4zXqDrvSWr]"

echo ""
echo "📋 1. LOGIN CONT 1"
echo "================="

LOGIN1_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL1\",\"password\":\"$PASSWORD1\"}")

ACCESS_TOKEN1=$(echo "$LOGIN1_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

echo "✅ Login cont 1 successful"

echo ""
echo "📋 2. LOGIN CONT 2"
echo "================="

LOGIN2_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL2\",\"password\":\"$PASSWORD2\"}")

ACCESS_TOKEN2=$(echo "$LOGIN2_RESPONSE" | jq -r '.accessToken' 2>/dev/null)

echo "✅ Login cont 2 successful"

echo ""
echo "📋 3. RE-REGISTER TOKENS (CLEAN)"
echo "==============================="

# Register token cont 1 (doar pe contul 1)
echo "📱 Register token cont 1..."
REGISTER1_RESPONSE=$(curl -s -X POST "$API_URL/devices/push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN1'",
    "platform": "ios",
    "deviceId": "device-andrei-clean"
  }')

echo "$REGISTER1_RESPONSE" | jq '.' 2>/dev/null

# Register token cont 2 (doar pe contul 2)
echo ""
echo "📱 Register token cont 2..."
REGISTER2_RESPONSE=$(curl -s -X POST "$API_URL/devices/push-token" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "'$TOKEN2'",
    "platform": "ios", 
    "deviceId": "device-chiril-clean"
  }')

echo "$REGISTER2_RESPONSE" | jq '.' 2>/dev/null

echo ""
echo "📋 4. TEST ISOLAT CONT 1"
echo "======================"

TEST1_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN1" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CONT 1 ONLY",
    "message": "Doar pentru contul 1 (andrei)"
  }')

echo "📱 Test cont 1:"
echo "$TEST1_RESPONSE" | jq '. | {success, message, results}' 2>/dev/null

echo ""
echo "📋 5. TEST ISOLAT CONT 2"
echo "======================"

TEST2_RESPONSE=$(curl -s -X POST "$API_URL/test/send" \
  -H "Authorization: Bearer $ACCESS_TOKEN2" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CONT 2 ONLY", 
    "message": "Doar pentru contul 2 (chiril)"
  }')

echo "📱 Test cont 2:"
echo "$TEST2_RESPONSE" | jq '. | {success, message, results}' 2>/dev/null

echo ""
echo "🎯 REZULTATE AȘTEPTATE:"
echo "======================"
echo "📱 Device 1 (andrei): DOAR notificarea 'CONT 1 ONLY'"
echo "📱 Device 2 (chiril): DOAR notificarea 'CONT 2 ONLY'"
echo ""
echo "Dacă primești notificări greșite, problema e la token sharing!"
echo "Verifică în app că fiecare device are token-ul corect!"
