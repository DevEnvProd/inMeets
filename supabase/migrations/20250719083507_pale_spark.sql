/*
  # Initial Schema for Real Estate CRM Platform

  1. New Tables
    - `organizations`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text, optional)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `subscription_plans`
      - `id` (text, primary key)
      - `name` (text)
      - `description` (text)
      - `price_monthly` (integer, in cents)
      - `price_yearly` (integer, in cents)
      - `max_users` (integer)
      - `features` (jsonb)
      - `created_at` (timestamp)

    - `user_organizations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `organization_id` (uuid, references organizations)
      - `role` (text, enum: organizer, member)
      - `created_at` (timestamp)

    - `invitations`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `email` (text)
      - `code` (text, unique)
      - `status` (text, enum: pending, accepted, expired)
      - `created_by` (uuid, references auth.users)
      - `used_by` (uuid, references auth.users, optional)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their organizations
    - Add policies for organization members to access organization data
*/

-- Create organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  price_monthly integer NOT NULL, -- in cents
  price_yearly integer NOT NULL, -- in cents
  max_users integer NOT NULL DEFAULT 1,
  features jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create user_organizations table
CREATE TABLE IF NOT EXISTS user_organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  role text NOT NULL CHECK (role IN ('organizer', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create invitations table
CREATE TABLE IF NOT EXISTS invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  code text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired')),
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  used_by uuid REFERENCES auth.users(id),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Organizations policies
CREATE POLICY "Users can view organizations they belong to"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create organizations"
  ON organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Organizers can update their organizations"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (
    id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'organizer'
    )
  );

-- Subscription plans policies (read-only for all authenticated users)
CREATE POLICY "All authenticated users can view subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

-- User organizations policies
CREATE POLICY "Users can view their organization memberships"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can join organizations"
  ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Organizers can manage organization memberships"
  ON user_organizations
  FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'organizer'
    )
  );

-- Invitations policies
CREATE POLICY "Organization members can view invitations"
  ON invitations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organizers can create invitations"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid() AND role = 'organizer'
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update invitations they use"
  ON invitations
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (used_by = auth.uid());

-- Insert default subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, max_users, features) VALUES
('starter', 'Starter', 'Perfect for individual agents', 2900, 29000, 1, '["Up to 50 properties", "Basic CRM", "Email support", "Mobile app"]'),
('professional', 'Professional', 'Great for small teams', 7900, 79000, 5, '["Up to 500 properties", "Advanced CRM", "AI insights", "Priority support", "Team collaboration"]'),
('enterprise', 'Enterprise', 'For large organizations', 19900, 199000, 50, '["Unlimited properties", "Full CRM suite", "Advanced AI", "24/7 support", "Custom integrations", "API access"]')
ON CONFLICT (id) DO NOTHING;

-- Create function to generate invitation codes
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS text AS $$
BEGIN
  RETURN upper(substring(md5(random()::text) from 1 for 8));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate invitation codes
CREATE OR REPLACE FUNCTION set_invitation_code()
RETURNS trigger AS $$
BEGIN
  IF NEW.code IS NULL THEN
    NEW.code := generate_invitation_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_invitation_code
  BEFORE INSERT ON invitations
  FOR EACH ROW
  EXECUTE FUNCTION set_invitation_code();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for organizations updated_at
CREATE TRIGGER tr_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();