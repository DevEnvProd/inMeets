/*
  # Add Stripe subscription fields to organizations

  1. Changes
    - Add stripe_subscription_id to organizations table
    - Add subscription_expires_at to organizations table  
    - Add billing_cycle to organizations table
    - Update existing organizations with default values

  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- Add Stripe subscription fields to organizations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE organizations ADD COLUMN stripe_subscription_id text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'subscription_expires_at'
  ) THEN
    ALTER TABLE organizations ADD COLUMN subscription_expires_at timestamptz;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'organizations' AND column_name = 'billing_cycle'
  ) THEN
    ALTER TABLE organizations ADD COLUMN billing_cycle text DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly'));
  END IF;
END $$;

-- Create index for faster subscription lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_subscription_id ON organizations(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_organizations_subscription_status ON organizations(subscription_status);