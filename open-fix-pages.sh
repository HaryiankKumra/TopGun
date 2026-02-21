#!/bin/bash

echo "🚀 Opening Supabase Dashboard pages..."
echo ""

echo "1️⃣ Opening SQL Editor (run FIX_ALL_ERRORS_NOW.sql here)..."
open "https://supabase.com/dashboard/project/ogrlozmfbkotgdcnlobo/sql/new"
sleep 2

echo "2️⃣ Opening API Settings (copy anon key from here)..."
open "https://supabase.com/dashboard/project/ogrlozmfbkotgdcnlobo/settings/api"
sleep 2

echo ""
echo "✅ Dashboard pages opened in browser!"
echo ""
echo "📋 NEXT STEPS:"
echo "  1. In SQL Editor: Paste FIX_ALL_ERRORS_NOW.sql → RUN"
echo "  2. In API Settings: Copy 'anon public' key (starts with eyJ...)"
echo "  3. Update .env file: Replace VITE_SUPABASE_PUBLISHABLE_KEY"
echo "  4. Restart dev server: npm run dev"
echo "  5. Hard refresh browser: Cmd+Shift+R"
echo ""
echo "📝 Full instructions: See URGENT_FIX_RIGHT_NOW.md"
