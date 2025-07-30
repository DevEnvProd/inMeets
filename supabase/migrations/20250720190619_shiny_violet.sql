/*
  # Add subscription fields to organizations

  1. Changes
    - Add subscription_plan_id to organizations table
    - Add subscription_status to organizations table
    - Add foreign key constraint to subscription_plans
    - Update RLS policies

  2. Security
    - Maintain existing RLS policies
    - Ensure proper access control
*/

-- Add subscription fields to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_plan_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_plan_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_status'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_status text DEFAULT 'pending';
  END IF;
END $$;

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_subscription_plan_id_fkey'
  ) THEN
    ALTER TABLE organizations 
    ADD CONSTRAINT organizations_subscription_plan_id_fkey 
    FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id);
  END IF;
END $$;

-- Add check constraint for subscription_status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'organizations_subscription_status_check'
  ) THEN
    ALTER TABLE organizations 
    ADD CONSTRAINT organizations_subscription_status_check 
    CHECK (subscription_status IN ('pending', 'active', 'cancelled', 'expired'));
  END IF;
END $$;