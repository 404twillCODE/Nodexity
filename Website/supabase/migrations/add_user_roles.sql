-- Add role to User. Run in Supabase SQL Editor if you already have the User table.
-- Roles: 'user' (default), 'mod', 'admin', 'owner'

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "role" TEXT NOT NULL DEFAULT 'user';

-- Set yourself as owner (run this and replace with your email):
-- UPDATE "User" SET "role" = 'owner' WHERE "email" = 'your@email.com';
