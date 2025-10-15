# Welcome to your Expo app 👋

# Bloodline - Discover Your Roots, Connect Your Branches

**Bloodline** is a collaborative family tree app where each family member adds the people they know, and the app automatically connects everyone and calculates relationships. Unlike traditional family tree apps where one person does all the work, Bloodline is truly collaborative.

## 🌟 Features

### Core Features (MVP)
- **Phone Authentication**: Sign up with phone number and OTP verification
- **Collaborative Tree Building**: Each person adds their immediate family
- **Automatic Relationship Calculation**: App figures out extended relationships
- **SMS Invitations**: Invite family members via SMS with unique codes
- **Real-time Updates**: See tree changes instantly as family joins
- **Family Messaging**: Chat with verified family members
- **Discovery**: Find pending invites and suggested relatives
- **Profile Management**: Add photos, bio, location, life dates
- **Privacy Controls**: Control who sees your information
- **Deceased Members**: Honor those who passed with memories

### Relationship Tiers
- **Superior Family**: Parents, siblings, children, spouse, grandparents
- **Intermediate Family**: Aunts, uncles, cousins, nieces, nephews  
- **Distant Relatives**: Second cousins, great aunts/uncles, etc.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Expo CLI
- Supabase account
- Twilio account (for SMS)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd Bloodline
   npm install
   ```

2. **Set up Supabase**
   - Create a new Supabase project
   - Run the schema from `supabase/schema.sql` in SQL Editor
   - Enable Phone Auth provider
   - Add `bloodline://auth-callback` to redirect URLs

3. **Configure environment**
   ```bash
   # Create .env file
   echo "EXPO_PUBLIC_SUPABASE_URL=your_supabase_url" >> .env
   echo "EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key" >> .env
   ```

4. **Start the app**
   ```bash
   npx expo start
   ```

## 📱 App Structure

```
app/
├── (tabs)/              # Main tab navigation
│   ├── index.tsx        # Home/Tree view
│   ├── discovery/       # Invitations & suggestions
│   ├── messages/        # Family chat
│   └── settings/        # Profile & preferences
├── phone-auth.tsx       # Phone authentication
├── add-family.tsx       # Add family member flow
├── profile/[id].tsx     # View family profiles
├── tree.tsx            # Full tree visualization
└── onboarding.tsx      # First-time tutorial

utils/
├── supabaseClient.ts   # Supabase configuration
├── familyService.ts    # Family data operations
├── useAuth.ts          # Authentication hook
└── relationshipCalculator.ts # Relationship logic

components/
├── FamilyTree.tsx      # Tree visualization
├── RelationshipPicker.tsx # Relationship selector
└── themed-*.tsx        # UI components
```

## 🔧 Technical Stack

- **Frontend**: React Native + Expo
- **Navigation**: Expo Router (file-based)
- **Backend**: Supabase (PostgreSQL + Auth + Realtime)
- **State**: React hooks + Supabase subscriptions
- **Styling**: StyleSheet + themed components
- **SMS**: Twilio/Africa's Talking (via Edge Functions)

## 📊 Database Schema

### Core Tables
- `profiles` - User profiles with contact info
- `relationships` - Bidirectional family connections
- `invitations` - Pending family invites with codes
- `messages` - Chat between family members
- `photos` - Family photos with tags
- `memories` - Stories about deceased members
- `milestones` - Achievement tracking

### Key Features
- Row Level Security (RLS) for privacy
- Real-time subscriptions for updates
- Automatic relationship calculation
- Invitation code system

## 🎯 User Flows

### Sign Up Flow
1. Enter phone number → Receive OTP
2. Verify code → Enter name
3. Complete onboarding tutorial
4. Start adding family members

### Adding Family
1. Enter member details (name, phone, relationship)
2. App sends SMS invitation
3. Member joins and confirms relationship
4. Tree automatically updates

### Discovery
1. See pending invitations
2. View incoming requests
3. Find suggested relatives
4. Connect with extended family

## 🔐 Privacy & Security

- Phone-based authentication
- Bidirectional relationship verification
- Granular privacy controls
- Secure messaging between verified family
- Profile visibility settings

## 🚦 Development Status

### ✅ Completed
- Phone authentication
- Supabase integration
- Family member management
- Relationship calculation
- Tree visualization
- Messaging system
- Discovery features
- Profile management
- Settings & privacy

### 🔄 In Progress
- SMS integration (Twilio/Africa's Talking)
- Photo uploads to Supabase Storage
- Push notifications
- Milestones & achievements

### 📋 Planned
- Family groups
- Event planning
- Family health history
- Export tree as PDF
- Multi-language support

## 📝 Environment Variables

```env
# Required
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Optional (for SMS)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_token
TWILIO_PHONE_NUMBER=+1234567890
```

## 🤝 Contributing

This is an MVP implementation. Key areas for contribution:
- SMS provider integration
- Photo upload implementation
- Performance optimizations
- UI/UX improvements
- Testing coverage

## 📄 License

Private project - All rights reserved

## 🙏 Acknowledgments

- Built with Expo and React Native
- Powered by Supabase
- Icons from SF Symbols / Material Icons
- Inspired by the need to connect families

---

**Tagline**: Discover Your Roots, Connect Your Branches 🌳
