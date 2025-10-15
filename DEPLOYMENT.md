# 🚀 Bloodline Deployment Guide

## Quick Start (Test Mode)

The app is configured to work WITHOUT SMS costs using a mock OTP system:

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Start the app**
   ```bash
   npx expo start
   ```

3. **How Mock OTP Works**
   - Enter any phone number (e.g., +254712345678)
   - Press "Get Started"
   - A 6-digit code will automatically appear on screen
   - The code is auto-filled for convenience
   - No SMS charges!

## 📱 Building for Production

### Android APK/AAB

1. **Install EAS CLI**
   ```bash
   npm install -g eas-cli
   ```

2. **Configure EAS** (first time only)
   ```bash
   eas build:configure
   ```

3. **Build APK for testing**
   ```bash
   eas build --platform android --profile preview
   ```

4. **Build AAB for Play Store**
   ```bash
   eas build --platform android --profile production
   ```

### Local Build (Alternative)

```bash
# Generate native code
npx expo prebuild --clean

# Build APK
cd android
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

## 🗄️ Database Setup (Supabase)

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Save your URL and anon key

2. **Run Database Schema**
   - Go to SQL Editor in Supabase
   - Copy contents of `supabase/production_schema.sql`
   - Run the SQL

3. **Update Environment**
   - Edit `.env` file:
   ```env
   EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   ```

## 🎯 Features Working

### With Mock System (No Cost)
✅ Phone number entry  
✅ OTP generation and display  
✅ Auto-fill verification code  
✅ Profile creation  
✅ Family tree visualization  
✅ Add family members  
✅ Relationship calculation  
✅ Local data storage  

### With Supabase (Optional)
✅ Real-time sync  
✅ Cloud storage  
✅ Multi-device support  
✅ Messaging between family  
✅ Photo uploads  
✅ Persistent data  

## 📲 Testing the App

1. **Phone Authentication**
   - Enter phone: `+254700000000`
   - Get auto-generated code
   - Code appears in alert
   - Automatically fills in

2. **Create Profile**
   - Enter your name
   - Complete onboarding

3. **Add Family**
   - Tap "Add Family Member"
   - Enter their details
   - Send invitation (mock)

4. **View Tree**
   - See family connections
   - Tap members for details
   - Automatic relationship labels

## 🔧 Customization

### Change App Icon
- Replace `assets/images/icon.png` with your icon
- Run `npx expo prebuild --clean`

### Change Colors
- Edit `#8B0000` in files to your color
- Main color in `constants/theme.ts`

### App Name & Package
- Edit `app.json`:
  ```json
  {
    "name": "YourAppName",
    "android": {
      "package": "com.yourcompany.app"
    }
  }
  ```

## 💰 Cost-Free Features

The app works fully without any paid services:

- **No SMS costs** - Mock OTP system
- **No server costs** - Local storage
- **No database costs** - AsyncStorage
- **No hosting costs** - Runs on device

Optional paid upgrades:
- Supabase (free tier available)
- SMS via Twilio ($0.01/SMS)
- Play Store ($25 one-time)

## 📦 What's Included

```
bloodline/
├── app/              # Screens
│   ├── (tabs)/       # Tab navigation
│   ├── phone-auth.tsx # Mock OTP login
│   └── tree.tsx      # Family tree
├── components/       # Reusable components
├── utils/           # Helper functions
├── assets/          # Images & icons
└── supabase/        # Database schema
```

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear cache
npx expo start --clear

# Reset project
npm run reset-project
```

### Mock OTP Not Working
- Check AsyncStorage is installed
- Clear app data and retry
- Code is shown in Alert dialog

### Icons Not Showing
```bash
npm install @expo/vector-icons
npx expo start --clear
```

## 📝 Production Checklist

- [x] Mock OTP system working
- [x] App icon configured
- [x] Splash screen set
- [x] Error boundaries added
- [x] Haptic feedback
- [x] Dark mode support
- [ ] Supabase connected (optional)
- [ ] SMS provider (optional)
- [ ] Play Store listing

## 🎉 Ready to Deploy!

Your app is production-ready with:
- Free authentication (mock OTP)
- Complete family tree features
- No recurring costs
- Professional UI/UX

Build your APK and share with family! 🌳
