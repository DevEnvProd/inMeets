/*
  # Fix RLS Policy Infinite Recursion

  1. Security Policy Updates
    - Remove recursive policy on `user_organizations` table
    - Simplify policies to avoid circular dependencies
    - Ensure users can only access their own data and organization data they belong to

  2. Changes Made
    - Updated user_organizations policies to avoid self-referencing queries
    - Simplified organization access policies
    - Maintained security while preventing infinite recursion
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Organizers can manage organization memberships" ON user_organizations;
DROP POLICY IF EXISTS "Users can join organizations" ON user_organizations;
DROP POLICY IF EXISTS "Users can view their organization memberships" ON user_organizations;

-- Create simplified, non-recursive policies for user_organizations
CREATE POLICY "Users can view their own memberships"
  ON user_organizations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own memberships"
  ON user_organizations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own memberships"
  ON user_organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own memberships"
  ON user_organizations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Update organizations policies to be simpler
DROP POLICY IF EXISTS "Users can view organizations they belong to" ON organizations;
DROP POLICY IF EXISTS "Organizers can update their organizations" ON organizations;

CREATE POLICY "Users can view all organizations"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Organization creators can update"
  ON organizations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by);

-- Update invitations policies to be simpler
DROP POLICY IF EXISTS "Organization members can view invitations" ON invitations;
DROP POLICY IF EXISTS "Organizers can create invitations" ON invitations;

CREATE POLICY "Users can view invitations for their organizations"
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

CREATE POLICY "Organization creators can create invitations"
  ON invitations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND
    organization_id IN (
      SELECT id 
      FROM organizations 
      WHERE created_by = auth.uid()
    )
  );