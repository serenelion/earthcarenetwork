-- Migration: Add new enterprise categories
-- Date: 2025-10-10
-- Description: Add homes_that_heal, landscapes_that_nourish, and lifelong_learning_providers to enterprise_category enum

-- Add new enum values if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'homes_that_heal' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enterprise_category')) THEN
        ALTER TYPE enterprise_category ADD VALUE 'homes_that_heal';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'landscapes_that_nourish' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enterprise_category')) THEN
        ALTER TYPE enterprise_category ADD VALUE 'landscapes_that_nourish';
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'lifelong_learning_providers' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'enterprise_category')) THEN
        ALTER TYPE enterprise_category ADD VALUE 'lifelong_learning_providers';
    END IF;
END $$;
