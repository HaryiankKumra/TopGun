#!/bin/bash

# ============================================
# Deploy StressGuard AI Edge Functions
# ============================================
# This script deploys all Supabase Edge Functions
# Run this after: npm install -g supabase && supabase login
# ============================================

set -e  # Exit on any error

echo "🚀 Deploying StressGuard AI Edge Functions..."
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found!"
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase
fi

echo "✅ Supabase CLI found"
echo ""

# Check if logged in
echo "🔐 Checking authentication..."
if ! supabase projects list &> /dev/null; then
    echo "❌ Not logged in to Supabase"
    echo "🔑 Please login first:"
    echo ""
    echo "   supabase login"
    echo ""
    exit 1
fi

echo "✅ Authenticated"
echo ""

# Link project if not linked
echo "🔗 Linking to project ogrlozmfbkotgdcnlobo..."
if ! supabase status &> /dev/null 2>&1; then
    echo "⚠️  Project not linked. Linking now..."
    supabase link --project-ref ogrlozmfbkotgdcnlobo
else
    echo "✅ Project already linked"
fi

echo ""
echo "📦 Deploying Edge Functions..."
echo ""

# Deploy each function
FUNCTIONS=(
    "stress-chatbot"
    "ai-stress-explanation"
    "stress-ai-prediction"
    "receive-sensor-data"
    "get-latest-data"
)

for func in "${FUNCTIONS[@]}"; do
    echo "📤 Deploying $func..."
    if supabase functions deploy "$func" --no-verify-jwt; then
        echo "   ✅ $func deployed successfully"
    else
        echo "   ❌ Failed to deploy $func"
        exit 1
    fi
    echo ""
done

echo "🔑 Setting OpenAI API Key secret..."
if [ -f .env ]; then
    OPENAI_KEY=$(grep OPENAI_API_KEY .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    if [ -n "$OPENAI_KEY" ]; then
        supabase secrets set OPENAI_API_KEY="$OPENAI_KEY"
        echo "   ✅ OpenAI API Key set successfully"
    else
        echo "   ⚠️  No OpenAI API Key found in .env"
        echo "   💡 Set it manually: supabase secrets set OPENAI_API_KEY=your-key"
    fi
else
    echo "   ⚠️  .env file not found"
    echo "   💡 Set manually: supabase secrets set OPENAI_API_KEY=your-key"
fi

echo ""
echo "✅ All Edge Functions deployed successfully!"
echo ""
echo "📋 Deployed Functions:"
echo "   - stress-chatbot (AI chatbot)"
echo "   - ai-stress-explanation (Stress analysis)"
echo "   - stress-ai-prediction (ML predictions)"
echo "   - receive-sensor-data (ESP32 data)"
echo "   - get-latest-data (Latest sensor data)"
echo ""
echo "🔍 View functions at:"
echo "   https://supabase.com/dashboard/project/ogrlozmfbkotgdcnlobo/functions"
echo ""
echo "🎉 Deployment complete!"
