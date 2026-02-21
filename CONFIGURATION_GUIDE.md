# StressGuard AI - Configuration Guide

## 🚀 Quick Setup

### 1. **Supabase Configuration**

#### Required Environment Variables:

Create a `.env.local` file in your project root:

```env
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Supabase Function Environment Variables (for Edge Functions)
GPT_KEY=your_openai_api_key_for_chatbot
```

#### Supabase Setup Steps:

1. **Create Supabase Project:**
   - Go to [https://supabase.com](https://supabase.com)
   - Create a new project
   - Copy your Project URL and Anon Key

2. **Enable Google OAuth (for Google Login):**
   - Go to Authentication > Providers
   - Enable Google provider
   - Add your Google OAuth credentials:
     - Client ID: `your_google_client_id`
     - Client Secret: `your_google_client_secret`
   - Add authorized domains: `localhost`, your production domain

3. **Run Database Migrations:**
   ```bash
   npx supabase migration up
   ```

### 2. **API Keys Required**

#### OpenAI API Key (for Chatbot):

- **Where to get:** [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Where to add:** In Supabase Edge Functions environment
- **How to add:**
  ```bash
  npx supabase secrets set GPT_KEY=your_openai_api_key
  ```

#### Google OAuth Credentials:

- **Where to get:** [Google Cloud Console](https://console.cloud.google.com/)
- **Steps:**
  1. Create new project or select existing
  2. Enable Google+ API
  3. Go to Credentials > Create Credentials > OAuth 2.0 Client ID
  4. Application type: Web application
  5. Authorized redirect URIs: `https://your-project.supabase.co/auth/v1/callback`

### 3. **Database Setup**

The app uses these main tables:

- `auth_users` - User authentication
- `user_profiles` - User profile data
- `health_records` - Medical conditions and health data
- `stress_detections` - Stress monitoring data
- `chat_history` - Chatbot conversations
- `biometric_readings` - Sensor data

**To initialize database with sample data:**

1. Open the app in development mode
2. Go to homepage and click "Show Developer Tools"
3. Click "Initialize with Sample Data"

### 4. **Current Features Status**

✅ **Working Features:**

- User authentication (mock and Supabase)
- Profile management and settings
- Stress monitoring dashboard
- Camera emotion detection (simulated)
- Health records management
- Biometric data visualization

⚠️ **Requires Configuration:**

- Google OAuth login (needs Google credentials)
- AI Chatbot (needs OpenAI API key)
- Real-time stress detection (needs ML models)

🔧 **Development Features:**

- Mock authentication (works offline)
- Sample data initialization
- Database health checks
- Comprehensive debugging tools

### 5. **Test Accounts (No API Keys Required)**

Use these for immediate testing:

| Email                      | Password      | Profile                       |
| -------------------------- | ------------- | ----------------------------- |
| `john.doe@example.com`     | `password123` | Hypertension, Anxiety         |
| `sarah.smith@example.com`  | `demo123`     | Diabetes, Migraines           |
| `mike.johnson@example.com` | `admin123`    | High Cholesterol, Sleep Apnea |
| `emily.brown@example.com`  | `patient123`  | Asthma, Allergies             |
| `david.wilson@example.com` | `test123`     | Arthritis, Depression         |

### 6. **Local Development**

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# The app will run on http://localhost:5173
```

### 7. **Production Deployment**

#### Environment Variables for Production:

```env
VITE_SUPABASE_URL=your_production_supabase_url
VITE_SUPABASE_ANON_KEY=your_production_supabase_anon_key
```

#### Deploy Supabase Functions:

```bash
npx supabase functions deploy stress-chatbot
npx supabase functions deploy receive-sensor-data
npx supabase functions deploy get-latest-data
```

### 8. **Troubleshooting**

#### Google Login Error: "provider is not enabled"

- **Cause:** Google OAuth not configured in Supabase
- **Fix:** Enable Google provider in Supabase Authentication settings

#### Chatbot Not Working:

- **Cause:** Missing OpenAI API key
- **Fix:** Add `GPT_KEY` to Supabase Edge Functions environment

#### Profile Data Not Saving:

- **Cause:** Database connection issues
- **Fix:** Check Supabase credentials and run database migrations

#### Camera Module Issues:

- **Cause:** Browser permissions or HTTPS requirement
- **Fix:** Allow camera permissions, use HTTPS in production

### 9. **Optional Integrations**

#### TensorFlow.js Models (for Real Emotion Detection):

- Place model files in `/public/models/facial/`
- Update `CameraModule.tsx` to load your models
- Models should export emotion prediction functions

#### ESP32 Integration (for Real Biometric Data):

- Configure ESP32 to send data to `/supabase/functions/receive-sensor-data`
- Update sensor endpoints in dashboard components

### 10. **Support**

If you encounter issues:

1. Check the browser console for errors
2. Use the built-in debugging tools (Developer Tools panel)
3. Verify environment variables are set correctly
4. Ensure Supabase project is properly configured

---

## 📝 Quick Start Checklist

- [ ] Create Supabase project
- [ ] Add environment variables to `.env.local`
- [ ] Run database migrations
- [ ] Test with sample accounts
- [ ] (Optional) Configure Google OAuth
- [ ] (Optional) Add OpenAI API key for chatbot
- [ ] Deploy to production

**The app works fully offline with mock data - API keys are optional for testing!**
