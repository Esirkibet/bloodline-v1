-- BLOODLINE PRODUCTION DATABASE SCHEMA
-- Complete setup for Supabase

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS photo_tags CASCADE;
DROP TABLE IF EXISTS memories CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS photos CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS invitations CASCADE;
DROP TABLE IF EXISTS relationships CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  date_of_birth DATE,
  is_deceased BOOLEAN DEFAULT FALSE,
  date_of_death DATE,
  bio TEXT,
  location TEXT,
  occupation TEXT,
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('public', 'family', 'private')),
  onboarding_completed BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships table (bidirectional family connections)
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_from_a_to_b TEXT NOT NULL,
  relationship_from_b_to_a TEXT NOT NULL,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by_a BOOLEAN DEFAULT FALSE,
  verified_by_b BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b)
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_phone TEXT NOT NULL,
  invitee_email TEXT,
  relationship_to_inviter TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL DEFAULT UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6)),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  sent_via TEXT DEFAULT 'sms' CHECK (sent_via IN ('sms', 'email', 'link')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  invitee_profile_id UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'photo', 'system')),
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  photo_date DATE,
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('all', 'intermediate', 'superior', 'private')),
  is_profile_photo BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo tags
CREATE TABLE photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tagged_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, profile_id)
);

-- Memories for deceased members
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_text TEXT NOT NULL,
  memory_date DATE,
  is_private BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones tracking
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL CHECK (milestone_type IN (
    'first_connection', 'tree_10', 'tree_25', 'tree_50', 'tree_100',
    'new_generation', 'complete_branch', 'distant_relative', 'first_message'
  )),
  milestone_value INTEGER DEFAULT 0,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  celebrated BOOLEAN DEFAULT FALSE,
  UNIQUE(user_id, milestone_type)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'connection_accepted', 'connection_request', 'new_member_joined',
    'new_message', 'birthday_reminder', 'milestone_achieved'
  )),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_full_name ON profiles USING gin(full_name gin_trgm_ops);
CREATE INDEX idx_relationships_user_a ON relationships(user_a);
CREATE INDEX idx_relationships_user_b ON relationships(user_b);
CREATE INDEX idx_relationships_verified ON relationships(is_verified);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_invitations_phone ON invitations(invitee_phone);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_invitations_status ON invitations(status);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_messages_read ON messages(is_read);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles viewable by all" ON profiles
  FOR SELECT USING (visibility = 'public');

CREATE POLICY "Users can view family profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id OR
    visibility IN ('public', 'family') AND EXISTS (
      SELECT 1 FROM relationships
      WHERE is_verified = true AND (
        (user_a = auth.uid() AND user_b = profiles.id) OR
        (user_b = auth.uid() AND user_a = profiles.id)
      )
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Relationships policies
CREATE POLICY "Users can view their relationships" ON relationships
  FOR SELECT USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE POLICY "Users can create relationships" ON relationships
  FOR INSERT WITH CHECK (created_by = auth.uid() AND (user_a = auth.uid() OR user_b = auth.uid()));

CREATE POLICY "Users can update their relationships" ON relationships
  FOR UPDATE USING (user_a = auth.uid() OR user_b = auth.uid());

CREATE POLICY "Users can delete their relationships" ON relationships
  FOR DELETE USING (user_a = auth.uid() OR user_b = auth.uid());

-- Invitations policies
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (inviter_id = auth.uid() OR invitee_profile_id = auth.uid());

CREATE POLICY "Anyone can view invitation by code" ON invitations
  FOR SELECT USING (true);

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (inviter_id = auth.uid() OR invitee_profile_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send messages to verified family" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM relationships
      WHERE is_verified = true AND (
        (user_a = auth.uid() AND user_b = receiver_id) OR
        (user_b = auth.uid() AND user_a = receiver_id)
      )
    )
  );

CREATE POLICY "Users can update their sent messages" ON messages
  FOR UPDATE USING (sender_id = auth.uid());

-- Photos policies
CREATE POLICY "Users can view photos based on visibility" ON photos
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    visibility = 'all' OR
    (visibility IN ('family', 'intermediate', 'superior') AND EXISTS (
      SELECT 1 FROM relationships
      WHERE is_verified = true AND (
        (user_a = auth.uid() AND user_b = uploaded_by) OR
        (user_b = auth.uid() AND user_a = uploaded_by)
      )
    ))
  );

CREATE POLICY "Users can upload photos" ON photos
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update own photos" ON photos
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete own photos" ON photos
  FOR DELETE USING (uploaded_by = auth.uid());

-- Notifications policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

-- Milestones policies
CREATE POLICY "Users can view own milestones" ON milestones
  FOR SELECT USING (user_id = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.phone, NEW.email, 'unknown'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_relationships_updated_at BEFORE UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to check milestones
CREATE OR REPLACE FUNCTION check_milestones(user_id_param UUID)
RETURNS void AS $$
DECLARE
  connection_count INTEGER;
  generation_count INTEGER;
BEGIN
  -- Count connections
  SELECT COUNT(*) INTO connection_count
  FROM relationships
  WHERE is_verified = true AND (user_a = user_id_param OR user_b = user_id_param);
  
  -- Check connection milestones
  IF connection_count >= 1 THEN
    INSERT INTO milestones (user_id, milestone_type, milestone_value)
    VALUES (user_id_param, 'first_connection', 1)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
  
  IF connection_count >= 10 THEN
    INSERT INTO milestones (user_id, milestone_type, milestone_value)
    VALUES (user_id_param, 'tree_10', 10)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
  
  IF connection_count >= 25 THEN
    INSERT INTO milestones (user_id, milestone_type, milestone_value)
    VALUES (user_id_param, 'tree_25', 25)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
  
  IF connection_count >= 50 THEN
    INSERT INTO milestones (user_id, milestone_type, milestone_value)
    VALUES (user_id_param, 'tree_50', 50)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
  
  IF connection_count >= 100 THEN
    INSERT INTO milestones (user_id, milestone_type, milestone_value)
    VALUES (user_id_param, 'tree_100', 100)
    ON CONFLICT (user_id, milestone_type) DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to send notification
CREATE OR REPLACE FUNCTION send_notification(
  user_id_param UUID,
  type_param TEXT,
  title_param TEXT,
  body_param TEXT,
  data_param JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (user_id, type, title, body, data)
  VALUES (user_id_param, type_param, title_param, body_param, data_param)
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to check milestones after relationship verified
CREATE OR REPLACE FUNCTION after_relationship_verified()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_verified = true AND OLD.is_verified = false THEN
    -- Check milestones for both users
    PERFORM check_milestones(NEW.user_a);
    PERFORM check_milestones(NEW.user_b);
    
    -- Send notifications
    PERFORM send_notification(
      NEW.user_a,
      'connection_accepted',
      'Connection Confirmed',
      'Your family connection has been verified',
      jsonb_build_object('other_user_id', NEW.user_b)
    );
    
    PERFORM send_notification(
      NEW.user_b,
      'connection_accepted',
      'Connection Confirmed',
      'Your family connection has been verified',
      jsonb_build_object('other_user_id', NEW.user_a)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_after_relationship_verified
  AFTER UPDATE ON relationships
  FOR EACH ROW EXECUTE FUNCTION after_relationship_verified();

-- Function to expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE invitations
  SET status = 'expired'
  WHERE status = 'pending' AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Storage bucket setup (run after table creation)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('profile-photos', 'profile-photos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('family-photos', 'family-photos', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos');

CREATE POLICY "Anyone can upload an avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'profile-photos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'profile-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Sample data for testing (optional - remove for production)
-- INSERT INTO profiles (id, phone, full_name) VALUES
--   ('00000000-0000-0000-0000-000000000001'::uuid, '+254700000001', 'Test User 1'),
--   ('00000000-0000-0000-0000-000000000002'::uuid, '+254700000002', 'Test User 2');

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Final message
DO $$
BEGIN
  RAISE NOTICE 'Bloodline database schema created successfully!';
  RAISE NOTICE 'Remember to:';
  RAISE NOTICE '1. Enable Phone Auth in Supabase Dashboard';
  RAISE NOTICE '2. Configure SMS provider (Twilio/Africa''s Talking)';
  RAISE NOTICE '3. Set up Edge Functions for SMS sending';
  RAISE NOTICE '4. Configure storage buckets permissions';
END $$;
