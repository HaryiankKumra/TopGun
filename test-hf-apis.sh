#!/bin/bash

# ============================================
# Test Hugging Face APIs
# ============================================
# This script tests if the Hugging Face Spaces
# APIs are accessible and working
# ============================================

echo "🧪 Testing Hugging Face API Endpoints..."
echo ""

# Test Facial Stress API
echo "1️⃣ Testing Facial Stress API..."
echo "URL: https://haryiank-facial-stress.hf.space"
echo ""

FACIAL_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://haryiank-facial-stress.hf.space" || echo "000")

if [ "$FACIAL_STATUS" = "200" ]; then
    echo "   ✅ Facial Stress Space is awake (HTTP $FACIAL_STATUS)"
else
    echo "   ⚠️  Facial Stress Space returned HTTP $FACIAL_STATUS"
    echo "   💡 Open https://haryiank-facial-stress.hf.space in browser to wake it up"
fi

echo ""

# Test Wearable Stress API
echo "2️⃣ Testing Wearable Stress API..."
echo "URL: https://mrinal007-wesad.hf.space"
echo ""

WEARABLE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://mrinal007-wesad.hf.space" || echo "000")

if [ "$WEARABLE_STATUS" = "200" ]; then
    echo "   ✅ Wearable Stress Space is awake (HTTP $WEARABLE_STATUS)"
else
    echo "   ⚠️  Wearable Stress Space returned HTTP $WEARABLE_STATUS"
    echo "   💡 Open https://mrinal007-wesad.hf.space in browser to wake it up"
fi

echo ""
echo "📋 Summary:"
echo ""

if [ "$FACIAL_STATUS" = "200" ] && [ "$WEARABLE_STATUS" = "200" ]; then
    echo "✅ Both APIs are accessible!"
    echo ""
    echo "🎯 Next Steps:"
    echo "1. Test the actual prediction endpoints"
    echo "2. Check for CORS errors in browser console (F12)"
    echo "3. First request might take 30-60 seconds (cold start)"
else
    echo "⚠️  Some APIs are not accessible"
    echo ""
    echo "🔧 Fixes:"
    echo "1. Open the URLs in your browser to wake them up"
    echo "2. Wait 30-60 seconds for spaces to load"
    echo "3. Run this script again to verify"
fi

echo ""
echo "🌐 Open these URLs in browser to wake up:"
echo "   - https://haryiank-facial-stress.hf.space"
echo "   - https://mrinal007-wesad.hf.space"
