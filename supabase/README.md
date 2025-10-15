# Supabase Setup for Bloodline

## 1. Run the Schema

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `schema.sql`
4. Run the SQL to create all tables and policies

## 2. Enable Phone Auth

1. Go to Authentication → Providers
2. Enable Phone provider
3. Configure SMS provider (Twilio recommended):
   - Sign up for Twilio account
   - Get Account SID, Auth Token, and Phone Number
   - Add these to Supabase Phone provider settings

## 3. Storage Setup (for profile photos)

Run this SQL to create storage buckets:

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('profile-photos', 'profile-photos', true),
  ('family-photos', 'family-photos', false);

-- Storage policies for profile photos
CREATE POLICY "Users can upload own profile photo" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Profile photos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Users can update own profile photo" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own profile photo" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'profile-photos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for family photos
CREATE POLICY "Authenticated users can upload family photos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'family-photos' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Family members can view family photos" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'family-photos' AND
    auth.uid() IS NOT NULL
  );
```

## 4. Edge Functions (for SMS)

For production SMS sending, create an edge function:

```typescript
// supabase/functions/send-invitation-sms/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, inviterName, relationship, inviteCode } = await req.json()
    
    // Use Twilio or Africa's Talking API here
    const message = `${inviterName} says you're their ${relationship}. Join Bloodline to see your family tree: bloodline://invite?code=${inviteCode}`
    
    // Send SMS (implement with your SMS provider)
    // await sendSMS(phone, message)
    
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
```

Deploy with:
```bash
supabase functions deploy send-invitation-sms
```

## 5. Environment Variables

Make sure your app has these environment variables:

```
EXPO_PUBLIC_SUPABASE_URL=https://fdwrjtmajvtbffjkplkw.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

## 6. Test the Setup

1. Run the app
2. Sign up with a phone number
3. Add a family member
4. Check that the invitation is created in the database
5. Accept the invitation from another account
6. Verify the relationship is created

## Database Structure

- **profiles**: User profiles with phone, name, photo, etc.
- **relationships**: Bidirectional family connections
- **invitations**: Pending family invitations with codes
- **messages**: Chat messages between family members
- **photos**: Family photos with tags
- **memories**: Stories about deceased members
- **milestones**: Achievement tracking

## Real-time Subscriptions

The app uses Supabase real-time for:
- New messages
- Family tree updates
- Invitation status changes
- Profile updates
