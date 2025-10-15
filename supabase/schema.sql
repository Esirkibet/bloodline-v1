-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Relationships table (bidirectional family connections)
CREATE TABLE relationships (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_a UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_b UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL,
  relationship_from_a_to_b TEXT NOT NULL, -- e.g., "father" (A is B's father)
  relationship_from_b_to_a TEXT NOT NULL, -- e.g., "child" (B is A's child)
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by_a BOOLEAN DEFAULT FALSE,
  verified_by_b BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_a, user_b),
  CHECK (user_a < user_b) -- Ensure consistent ordering
);

-- Invitations table
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inviter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_name TEXT NOT NULL,
  invitee_phone TEXT NOT NULL,
  relationship_to_inviter TEXT NOT NULL,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  invitee_profile_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photos table
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  visibility TEXT DEFAULT 'family' CHECK (visibility IN ('all', 'intermediate', 'superior')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Photo tags (who appears in photos)
CREATE TABLE photo_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  photo_id UUID NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(photo_id, profile_id)
);

-- Memories for deceased members
CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  memory_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestones tracking
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone_type TEXT NOT NULL,
  milestone_value INTEGER,
  achieved_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, milestone_type, milestone_value)
);

-- Indexes for performance
CREATE INDEX idx_relationships_user_a ON relationships(user_a);
CREATE INDEX idx_relationships_user_b ON relationships(user_b);
CREATE INDEX idx_invitations_inviter ON invitations(inviter_id);
CREATE INDEX idx_invitations_phone ON invitations(invitee_phone);
CREATE INDEX idx_invitations_code ON invitations(invitation_code);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_receiver ON messages(receiver_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);

-- Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view family profiles" ON profiles
  FOR SELECT USING (
    visibility = 'public' OR
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM relationships
      WHERE is_verified = true AND (
        (user_a = auth.uid() AND user_b = profiles.id) OR
        (user_b = auth.uid() AND user_a = profiles.id)
      )
    )
  );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Relationships policies
CREATE POLICY "Users can view their relationships" ON relationships
  FOR SELECT USING (
    user_a = auth.uid() OR user_b = auth.uid()
  );

CREATE POLICY "Users can create relationships" ON relationships
  FOR INSERT WITH CHECK (
    created_by = auth.uid() AND (user_a = auth.uid() OR user_b = auth.uid())
  );

CREATE POLICY "Users can update their relationships" ON relationships
  FOR UPDATE USING (
    user_a = auth.uid() OR user_b = auth.uid()
  );

-- Invitations policies
CREATE POLICY "Users can view their invitations" ON invitations
  FOR SELECT USING (
    inviter_id = auth.uid() OR invitee_profile_id = auth.uid()
  );

CREATE POLICY "Users can create invitations" ON invitations
  FOR INSERT WITH CHECK (inviter_id = auth.uid());

CREATE POLICY "Users can update their invitations" ON invitations
  FOR UPDATE USING (
    inviter_id = auth.uid() OR invitee_profile_id = auth.uid()
  );

-- Messages policies
CREATE POLICY "Users can view their messages" ON messages
  FOR SELECT USING (
    sender_id = auth.uid() OR receiver_id = auth.uid()
  );

CREATE POLICY "Users can send messages" ON messages
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

-- Photos policies
CREATE POLICY "Users can view photos" ON photos
  FOR SELECT USING (
    uploaded_by = auth.uid() OR
    visibility = 'all' OR
    EXISTS (
      SELECT 1 FROM photo_tags WHERE photo_id = photos.id AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can upload photos" ON photos
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

-- Functions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, phone, full_name)
  VALUES (
    NEW.id,
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to calculate relationship paths
CREATE OR REPLACE FUNCTION calculate_relationship_path(from_user UUID, to_user UUID)
RETURNS TABLE(path UUID[], relationship_types TEXT[]) AS $$
WITH RECURSIVE relationship_path AS (
  -- Base case: direct relationships
  SELECT 
    ARRAY[user_a, user_b] as path,
    ARRAY[relationship_from_a_to_b] as rel_types,
    user_b as current_user,
    1 as depth
  FROM relationships
  WHERE user_a = from_user AND is_verified = true
  
  UNION ALL
  
  SELECT 
    ARRAY[user_b, user_a] as path,
    ARRAY[relationship_from_b_to_a] as rel_types,
    user_a as current_user,
    1 as depth
  FROM relationships
  WHERE user_b = from_user AND is_verified = true
  
  UNION ALL
  
  -- Recursive case
  SELECT 
    rp.path || r.user_b,
    rp.rel_types || r.relationship_from_a_to_b,
    r.user_b,
    rp.depth + 1
  FROM relationship_path rp
  JOIN relationships r ON r.user_a = rp.current_user AND r.is_verified = true
  WHERE rp.depth < 10 -- Limit depth to prevent infinite recursion
    AND NOT r.user_b = ANY(rp.path) -- Avoid cycles
    
  UNION ALL
  
  SELECT 
    rp.path || r.user_a,
    rp.rel_types || r.relationship_from_b_to_a,
    r.user_a,
    rp.depth + 1
  FROM relationship_path rp
  JOIN relationships r ON r.user_b = rp.current_user AND r.is_verified = true
  WHERE rp.depth < 10
    AND NOT r.user_a = ANY(rp.path)
)
SELECT path, rel_types
FROM relationship_path
WHERE current_user = to_user
ORDER BY array_length(path, 1)
LIMIT 1;
$$ LANGUAGE sql STABLE;
