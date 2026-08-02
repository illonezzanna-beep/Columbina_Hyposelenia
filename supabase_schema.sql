-- Supabase Database Schema for Mood Light Station & ESP32 Data Upload
-- Execute these SQL statements in your Supabase SQL Editor

-- 1. Table: mood_records (Primary table used by server)
CREATE TABLE IF NOT EXISTS mood_records (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  device_id TEXT NOT NULL,
  heart_rate INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  emotion_color TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for mood_records
CREATE POLICY "Allow public read on mood_records" 
  ON mood_records FOR SELECT USING (true);

CREATE POLICY "Allow public insert on mood_records" 
  ON mood_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on mood_records" 
  ON mood_records FOR DELETE USING (true);


-- 2. Table: heart_rate_records (Alternative table compatible with legacy schemas)
CREATE TABLE IF NOT EXISTS heart_rate_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'ESP32_MOOD_A01',
  device_id TEXT DEFAULT 'ESP32_MOOD_A01',
  heart_rate INTEGER NOT NULL,
  emotion TEXT NOT NULL,
  class_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE heart_rate_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for heart_rate_records
CREATE POLICY "Allow public read on heart_rate_records" 
  ON heart_rate_records FOR SELECT USING (true);

CREATE POLICY "Allow public insert on heart_rate_records" 
  ON heart_rate_records FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public delete on heart_rate_records" 
  ON heart_rate_records FOR DELETE USING (true);
