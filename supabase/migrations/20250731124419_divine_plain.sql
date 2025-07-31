/*
  # Add Properties Table for Client Management

  1. New Tables
    - `properties`
      - `id` (uuid, primary key)
      - `title` (text)
      - `description` (text)
      - `address` (text)
      - `price` (integer, in cents)
      - `area_sqft` (decimal)
      - `bedrooms` (integer)
      - `bathrooms` (integer)
      - `features` (text array)
      - `images` (text array)
      - `status` (text, enum: draft, published)
      - `project_id` (uuid, references projects)
      - `category_id` (uuid, references property_categories)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `projects`
      - `id` (uuid, primary key)
      - `name` (text)
      - `developer` (text)
      - `location` (text)
      - `description` (text)
      - `completion_date` (date)
      - `total_units` (integer)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `property_categories`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `property_activity_logs`
      - `id` (uuid, primary key)
      - `organization_id` (uuid, references organizations)
      - `user_id` (uuid, references auth.users)
      - `action` (text)
      - `entity_type` (text)
      - `entity_id` (uuid)
      - `description` (text)
      - `data_before` (jsonb)
      - `data_after` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for organization members
*/

-- Create projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  developer text NOT NULL,
  location text,
  description text,
  completion_date date,
  total_units integer,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create property_categories table
CREATE TABLE IF NOT EXISTS property_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  address text NOT NULL,
  price integer NOT NULL, -- in cents
  area_sqft decimal,
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  features text[],
  images text[],
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
  category_id uuid REFERENCES property_categories(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create property_activity_logs table
CREATE TABLE IF NOT EXISTS property_activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  description text,
  data_before jsonb,
  data_after jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_activity_logs ENABLE ROW LEVEL SECURITY;

-- Projects policies
CREATE POLICY "Organization members can view projects"
  ON projects
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create projects"
  ON projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Organization members can update projects"
  ON projects
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete projects"
  ON projects
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Property categories policies
CREATE POLICY "Organization members can view categories"
  ON property_categories
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create categories"
  ON property_categories
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Organization members can update categories"
  ON property_categories
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete categories"
  ON property_categories
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Properties policies
CREATE POLICY "Organization members can view properties"
  ON properties
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create properties"
  ON properties
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Organization members can update properties"
  ON properties
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete properties"
  ON properties
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Property activity logs policies
CREATE POLICY "Organization members can view activity logs"
  ON property_activity_logs
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create activity logs"
  ON property_activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
    AND user_id = auth.uid()
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_property_categories_organization_id ON property_categories(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_organization_id ON properties(organization_id);
CREATE INDEX IF NOT EXISTS idx_properties_project_id ON properties(project_id);
CREATE INDEX IF NOT EXISTS idx_properties_category_id ON properties(category_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_property_activity_logs_organization_id ON property_activity_logs(organization_id);

-- Create trigger for properties updated_at
CREATE TRIGGER tr_properties_updated_at
  BEFORE UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default property categories
INSERT INTO property_categories (name, description, organization_id, created_by)
SELECT 
  category_name,
  category_description,
  org.id,
  org.created_by
FROM (
  VALUES 
    ('新房', 'New properties from developers'),
    ('二手房', 'Resale properties'),
    ('拍卖房', 'Auction properties'),
    ('出租房', 'Rental properties'),
    ('商业地产', 'Commercial real estate')
) AS categories(category_name, category_description)
CROSS JOIN organizations org
WHERE NOT EXISTS (
  SELECT 1 FROM property_categories pc 
  WHERE pc.name = category_name AND pc.organization_id = org.id
);