# StressGuard AI - Database Setup Instructions

## 🗄️ **Required Database Tables**

Your Supabase project needs these tables for the app to work properly:

### **Quick Setup:**

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `supabase_schema.sql`
4. Click "Run" to create all tables

### **Tables Created:**

- `user_profiles` - User health profiles and settings
- `sensor_data` - ESP32 biometric sensor readings
- `stress_predictions` - AI stress analysis results
- `chat_history` - AI chatbot conversation history
- `health_records` - Medical records and documents
- `daily_metrics` - Daily health summaries
- `notifications` - System notifications
- `user_api_keys` - User's API key configurations
- `device_configs` - ESP32 device configurations
- `stress_events` - Stress episode tracking

### **Row Level Security (RLS):**

All tables have RLS enabled so users can only access their own data.

### **Environment Setup:**

Make sure you have these environment variables configured:

```bash
# Required - Your Supabase project details
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional - For enhanced features
VITE_OPENAI_API_KEY=your_openai_api_key_for_chatbot
```

### **Google OAuth Setup (Optional):**

1. Go to your Supabase dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials
4. Set redirect URL to: `https://your-domain.com/dashboard`

### **Testing the Setup:**

1. Create a new account using the signup page
2. Verify that a user profile is automatically created
3. Check that authentication state persists across page refreshes

---

**⚠️ Important:** The app now uses **ONLY** real Supabase authentication. No test accounts or mock data. Users must sign up with real email addresses.
