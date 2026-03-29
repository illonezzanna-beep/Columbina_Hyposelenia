-- Create the heart_rate_records table
CREATE TABLE heart_rate_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  heart_rate INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  class_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE heart_rate_records ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Allow users to insert their own records
CREATE POLICY "Users can insert their own records" 
ON heart_rate_records FOR INSERT 
WITH CHECK (true); -- In real app, check auth.uid()

-- Allow users to view their own records
CREATE POLICY "Users can view their own records" 
ON heart_rate_records FOR SELECT 
USING (true); -- In real app, filter by auth.uid()

-- Allow teachers to view all records (for anonymous stats)
CREATE POLICY "Teachers can view all records" 
ON heart_rate_records FOR SELECT 
USING (true);
