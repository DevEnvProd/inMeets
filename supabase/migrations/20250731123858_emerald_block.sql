/*
  # Client Management Schema

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `name` (text)
      - `email` (text, optional)
      - `phone` (text, optional)
      - `budget_min` (integer, in cents)
      - `budget_max` (integer, in cents)
      - `preferred_areas` (text array)
      - `notes` (text)
      - `whatsapp_number` (text, optional)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `client_viewing_records`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `property_id` (uuid, references properties)
      - `viewing_date` (timestamp)
      - `location` (text)
      - `feedback` (text)
      - `rating` (integer, 1-5)
      - `organization_id` (uuid, references organizations)
      - `created_by` (uuid, references auth.users)
      - `created_at` (timestamp)

    - `whatsapp_conversations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `whatsapp_number` (text)
      - `conversation_id` (text, unique)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamp)

    - `whatsapp_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, references whatsapp_conversations)
      - `message_id` (text, unique)
      - `sender_type` (text, enum: client, agent)
      - `content` (text)
      - `message_type` (text, enum: text, image, document)
      - `timestamp` (timestamp)
      - `ai_analyzed` (boolean, default false)
      - `ai_sentiment` (text, optional)
      - `ai_intent` (text, optional)
      - `ai_keywords` (text array, optional)
      - `created_at` (timestamp)

    - `client_ai_insights`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `insight_type` (text, enum: budget_update, area_preference, intent_level)
      - `insight_data` (jsonb)
      - `confidence_score` (decimal)
      - `source_message_id` (uuid, references whatsapp_messages, optional)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamp)

    - `ai_property_recommendations`
      - `id` (uuid, primary key)
      - `client_id` (uuid, references clients)
      - `property_id` (uuid, references properties)
      - `match_score` (decimal)
      - `match_reasons` (text array)
      - `organization_id` (uuid, references organizations)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for organization members to access client data
    - Add policies for WhatsApp integration
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  budget_min integer, -- in cents
  budget_max integer, -- in cents
  preferred_areas text[],
  notes text,
  whatsapp_number text,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create client viewing records table
CREATE TABLE IF NOT EXISTS client_viewing_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  viewing_date timestamptz NOT NULL,
  location text,
  feedback text,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_by uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create WhatsApp conversations table
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  whatsapp_number text NOT NULL,
  conversation_id text UNIQUE NOT NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create WhatsApp messages table
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES whatsapp_conversations(id) ON DELETE CASCADE NOT NULL,
  message_id text UNIQUE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('client', 'agent')),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'document')),
  timestamp timestamptz NOT NULL,
  ai_analyzed boolean DEFAULT false,
  ai_sentiment text,
  ai_intent text,
  ai_keywords text[],
  created_at timestamptz DEFAULT now()
);

-- Create client AI insights table
CREATE TABLE IF NOT EXISTS client_ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  insight_type text NOT NULL CHECK (insight_type IN ('budget_update', 'area_preference', 'intent_level', 'urgency', 'property_interest')),
  insight_data jsonb NOT NULL,
  confidence_score decimal(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
  source_message_id uuid REFERENCES whatsapp_messages(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create AI property recommendations table
CREATE TABLE IF NOT EXISTS ai_property_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE NOT NULL,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  match_score decimal(3,2) CHECK (match_score >= 0 AND match_score <= 1),
  match_reasons text[],
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(client_id, property_id)
);

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_viewing_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_property_recommendations ENABLE ROW LEVEL SECURITY;

-- Clients policies
CREATE POLICY "Organization members can view clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create clients"
  ON clients
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

CREATE POLICY "Organization members can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Client viewing records policies
CREATE POLICY "Organization members can view viewing records"
  ON client_viewing_records
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create viewing records"
  ON client_viewing_records
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

CREATE POLICY "Organization members can update viewing records"
  ON client_viewing_records
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can delete viewing records"
  ON client_viewing_records
  FOR DELETE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- WhatsApp conversations policies
CREATE POLICY "Organization members can view conversations"
  ON whatsapp_conversations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can create conversations"
  ON whatsapp_conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- WhatsApp messages policies
CREATE POLICY "Organization members can view messages"
  ON whatsapp_messages
  FOR SELECT
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id 
      FROM whatsapp_conversations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organization members can create messages"
  ON whatsapp_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id 
      FROM whatsapp_conversations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Organization members can update messages"
  ON whatsapp_messages
  FOR UPDATE
  TO authenticated
  USING (
    conversation_id IN (
      SELECT id 
      FROM whatsapp_conversations 
      WHERE organization_id IN (
        SELECT organization_id 
        FROM user_organizations 
        WHERE user_id = auth.uid()
      )
    )
  );

-- Client AI insights policies
CREATE POLICY "Organization members can view AI insights"
  ON client_ai_insights
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create AI insights"
  ON client_ai_insights
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- AI property recommendations policies
CREATE POLICY "Organization members can view recommendations"
  ON ai_property_recommendations
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can create recommendations"
  ON ai_property_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Organization members can update recommendations"
  ON ai_property_recommendations
  FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id 
      FROM user_organizations 
      WHERE user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_organization_id ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_created_by ON clients(created_by);
CREATE INDEX IF NOT EXISTS idx_client_viewing_records_client_id ON client_viewing_records(client_id);
CREATE INDEX IF NOT EXISTS idx_client_viewing_records_property_id ON client_viewing_records(property_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_client_id ON whatsapp_conversations(client_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation_id ON whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_client_ai_insights_client_id ON client_ai_insights(client_id);
CREATE INDEX IF NOT EXISTS idx_ai_property_recommendations_client_id ON ai_property_recommendations(client_id);

-- Create trigger for clients updated_at
CREATE TRIGGER tr_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to generate AI property recommendations
CREATE OR REPLACE FUNCTION generate_ai_recommendations(client_uuid uuid)
RETURNS void AS $$
DECLARE
  client_record clients%ROWTYPE;
  property_record properties%ROWTYPE;
  match_score decimal(3,2);
  reasons text[];
BEGIN
  -- Get client details
  SELECT * INTO client_record FROM clients WHERE id = client_uuid;
  
  -- Clear existing recommendations
  DELETE FROM ai_property_recommendations WHERE client_id = client_uuid;
  
  -- Generate recommendations for each property
  FOR property_record IN 
    SELECT * FROM properties 
    WHERE organization_id = client_record.organization_id 
    AND status = 'published'
  LOOP
    match_score := 0.0;
    reasons := ARRAY[]::text[];
    
    -- Budget matching (40% weight)
    IF property_record.price >= client_record.budget_min AND property_record.price <= client_record.budget_max THEN
      match_score := match_score + 0.4;
      reasons := array_append(reasons, 'Within budget range');
    ELSIF property_record.price <= client_record.budget_max * 1.1 THEN
      match_score := match_score + 0.2;
      reasons := array_append(reasons, 'Close to budget range');
    END IF;
    
    -- Area preference matching (30% weight)
    IF client_record.preferred_areas IS NOT NULL AND array_length(client_record.preferred_areas, 1) > 0 THEN
      IF EXISTS (
        SELECT 1 FROM unnest(client_record.preferred_areas) AS area
        WHERE property_record.address ILIKE '%' || area || '%'
      ) THEN
        match_score := match_score + 0.3;
        reasons := array_append(reasons, 'In preferred area');
      END IF;
    END IF;
    
    -- Property features matching (30% weight)
    IF property_record.features IS NOT NULL AND array_length(property_record.features, 1) > 0 THEN
      match_score := match_score + 0.3;
      reasons := array_append(reasons, 'Good features match');
    END IF;
    
    -- Only save recommendations with score > 0.3
    IF match_score > 0.3 THEN
      INSERT INTO ai_property_recommendations (
        client_id,
        property_id,
        match_score,
        match_reasons,
        organization_id
      ) VALUES (
        client_uuid,
        property_record.id,
        match_score,
        reasons,
        client_record.organization_id
      );
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to generate recommendations when client is updated
CREATE OR REPLACE FUNCTION trigger_generate_recommendations()
RETURNS trigger AS $$
BEGIN
  PERFORM generate_ai_recommendations(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_generate_client_recommendations
  AFTER INSERT OR UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_recommendations();