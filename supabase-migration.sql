-- Create the interested_users table for registration system
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS interested_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  wallet_address VARCHAR(255),
  registration_fee_paid BOOLEAN DEFAULT FALSE,
  payment_reference VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_interested_users_email ON interested_users(email);
CREATE INDEX IF NOT EXISTS idx_interested_users_wallet ON interested_users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_interested_users_payment_status ON interested_users(registration_fee_paid);

-- Enable Row Level Security (RLS)
ALTER TABLE interested_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Policy to allow insertions (for registration)
CREATE POLICY "Allow insert for anyone" ON interested_users 
FOR INSERT 
TO public 
WITH CHECK (true);

-- Policy to allow users to view their own data
CREATE POLICY "Allow select for own data" ON interested_users 
FOR SELECT 
TO public 
USING (auth.email() = email);

-- Policy to allow updates for own data (for payment confirmation)
CREATE POLICY "Allow update for own data" ON interested_users 
FOR UPDATE 
TO public 
USING (auth.email() = email)
WITH CHECK (auth.email() = email);

-- Admin policy (service role can do everything)
CREATE POLICY "Full access for service role" ON interested_users 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_interested_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_interested_users_updated_at
  BEFORE UPDATE ON interested_users
  FOR EACH ROW
  EXECUTE FUNCTION update_interested_users_updated_at();

-- Insert a sample user for testing (optional)
INSERT INTO interested_users (name, email, phone, wallet_address, registration_fee_paid)
VALUES (
  'Test User',
  'test@example.com',
  '+91 9876543210',
  '0x1234567890123456789012345678901234567890',
  false
) ON CONFLICT (email) DO NOTHING;
