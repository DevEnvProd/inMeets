/*
  # Property Management System Database Schema

  1. New Tables
    - `projects`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `developer` (text)
      - `description` (text)
      - `location` (text)
      - `organization_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `property_categories`
      - `id` (uuid, primary key)
      - `name` (text, not null)
      - `description` (text)
      - `organization_id` (uuid, foreign key)
      - `created_at` (timestamp)

    - `properties`
      - `id` (uuid, primary key)
      - `title` (text, not null)
      - `description` (text)
      - `address` (text)
      - `area_sqft` (integer)
      - `price` (decimal)
      - `bedrooms` (integer)
      - `bathrooms` (integer)
      - `features` (jsonb)
      - `images` (jsonb)
      - `status` (text, draft/published)
      - `project_id` (uuid, foreign key)
      - `category_id` (uuid, foreign key)
      - `organization_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `property_activity_logs`
      - `id` (uuid, primary key)
      - `property_id` (uuid, foreign key)
      - `action` (text)
      - `old_data` (jsonb)
      - `new_data` (jsonb)
      - `performed_by` (uuid, foreign key)
      - `organization_id` (uuid, foreign key)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for organization-based access
    - Add policies for draft/published property visibility

  3. Functions
    - Trigger function for updating timestamps
    - Trigger function for logging property changes
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text,
  description text,
  location text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property categories table
CREATE TABLE IF NOT EXISTS property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  address text,
  area_sqft integer,
  price decimal(15,2),
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  features jsonb DEFAULT '[]'::jsonb,
  images jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  category_id uuid REFERENCES property_categories(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property activity logs table
CREATE TABLE IF NOT EXISTS property_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid NOT NULL REFERENCES auth.users(id),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_activity_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Users can view projects in their organization"
  ON projects
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create projects in their organization"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update projects in their organization"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete projects in their organization"
  ON projects
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- RLS Policies for property categories
CREATE POLICY "Users can view categories in their organization"
  ON property_categories
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can create categories in their organization"
  ON property_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can update categories in their organization"
  ON property_categories
  FOR UPDATE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can delete categories in their organization"
  ON property_categories
  FOR DELETE
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

-- RLS Policies for properties
CREATE POLICY "Users can view published properties in their organization"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND (status = 'published' OR created_by = auth.uid())
  );

CREATE POLICY "Users can create properties in their organization"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can update their own properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

CREATE POLICY "Users can delete their own properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND created_by = auth.uid()
  );

-- RLS Policies for activity logs
CREATE POLICY "Users can view activity logs in their organization"
  ON property_activity_logs
  FOR SELECT
  TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
  ));

CREATE POLICY "System can insert activity logs"
  ON property_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM user_organizations WHERE user_id = auth.uid()
    ) AND performed_by = auth.uid()
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'tr_projects_updated_at'
  ) THEN
    CREATE TRIGGER tr_projects_updated_at
      BEFORE UPDATE ON projects
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'tr_properties_updated_at'
  ) THEN
    CREATE TRIGGER tr_properties_updated_at
      BEFORE UPDATE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Create function to log property changes
CREATE OR REPLACE FUNCTION log_property_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO property_activity_logs (
      property_id, action, new_data, performed_by, organization_id
    ) VALUES (
      NEW.id, 'created', to_jsonb(NEW), NEW.created_by, NEW.organization_id
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO property_activity_logs (
      property_id, action, old_data, new_data, performed_by, organization_id
    ) VALUES (
      NEW.id, 'updated', to_jsonb(OLD), to_jsonb(NEW), auth.uid(), NEW.organization_id
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO property_activity_logs (
      property_id, action, old_data, performed_by, organization_id
    ) VALUES (
      OLD.id, 'deleted', to_jsonb(OLD), auth.uid(), OLD.organization_id
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for property activity logging
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'tr_log_property_changes'
  ) THEN
    CREATE TRIGGER tr_log_property_changes
      AFTER INSERT OR UPDATE OR DELETE ON properties
      FOR EACH ROW
      EXECUTE FUNCTION log_property_changes();
  END IF;
END $$;

-- Insert default property categories
INSERT INTO property_categories (name, description, organization_id) 
SELECT 
  category_name,
  category_desc,
  org.id
FROM (
  VALUES 
    ('新房', 'New properties from developers'),
    ('二手房', 'Resale properties'),
    ('拍卖房', 'Auction properties'),
    ('出租房', 'Rental properties')
) AS categories(category_name, category_desc)
CROSS JOIN organizations org
WHERE NOT EXISTS (
  SELECT 1 FROM property_categories pc 
  WHERE pc.name = category_name AND pc.organization_id = org.id
);