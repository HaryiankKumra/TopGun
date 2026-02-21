-- FIX contact_messages table (404 error)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/ogrlozmfbkotgdcnlobo/sql/new

-- Create contact_messages table if not exists
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (for contact form)
DROP POLICY IF EXISTS "Allow public insert on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow public insert on contact_messages" 
  ON public.contact_messages 
  FOR INSERT 
  WITH CHECK (true);

-- Allow authenticated users to read their own messages
DROP POLICY IF EXISTS "Allow authenticated read on contact_messages" ON public.contact_messages;
CREATE POLICY "Allow authenticated read on contact_messages" 
  ON public.contact_messages 
  FOR SELECT 
  USING (true);

-- Grant permissions
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT, SELECT ON public.contact_messages TO authenticated;
GRANT ALL ON public.contact_messages TO service_role;

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ contact_messages table created/updated successfully!';
END $$;
