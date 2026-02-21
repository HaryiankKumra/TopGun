# SafeSpace - AI Stress Monitoring & Wellness Platform

<div align="center">

![SafeSpace](https://img.shields.io/badge/SafeSpace-AI-blue?style=for-the-badge)
![Version](https://img.shields.io/badge/version-1.0.0-green?style=for-the-badge)
![License](https://img.shields.io/badge/license-MIT-orange?style=for-the-badge)

**AI-Powered Stress Detection using Facial Analysis & Wellness Support**

</div>

---

## 🎯 Overview

**SafeSpace** is a comprehensive stress monitoring and mental wellness platform featuring:
- **Real-time Facial Expression Analysis** (Browser-based ML with face-api.js)
- **AI Stress Chatbot** (Smart keyword-based stress management advice)
- **Biometric Data Visualization** (ESP32 sensor integration ready)
- **Personalized Wellness Recommendations**

---

## ✨ Features

- 📊 **Dashboard** - Real-time stress scores, vital signs, and facial analysis
- 🤖 **AI Chatbot** - Smart stress management advice and coping techniques
- 📸 **Facial Analysis** - Browser-based emotion detection using face-api.js
- 📈 **Analytics** - Historical stress trends and patterns
- 🏥 **Health Records** - Personal health data management
- ⚙️ **Settings** - Customizable stress thresholds and notifications

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Supabase (PostgreSQL, Edge Functions, Auth)
- **ML**: face-api.js (browser-based facial expression detection)
- **Deployment**: Vercel

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

```bash
# Clone repository
git clone https://github.com/HaryiankKumra/safe_space.git
cd safe_space

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 📦 Database Setup

Run `FIX_CONTACT_TABLE.sql` in Supabase SQL Editor to set up the contact form.

Required tables:
- `user_profiles` - User settings and thresholds
- `biometric_data_enhanced` - Sensor readings
- `contact_messages` - Contact form submissions

---

## 🌐 Deployment

### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

Add environment variables in Vercel dashboard.

---

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<div align="center">
Made with ❤️ for mental wellness
</div>
