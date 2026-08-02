import { createClient } from '@supabase/supabase-js';

const rawUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let formattedUrl = rawUrl ? rawUrl.trim() : '';
if (formattedUrl && !/^https?:\/\//i.test(formattedUrl)) {
  formattedUrl = 'https://' + formattedUrl;
}

let clientInstance = null;
if (formattedUrl && supabaseAnonKey) {
  try {
    clientInstance = createClient(formattedUrl, supabaseAnonKey);
  } catch (err) {
    console.error('Failed to create Supabase client:', err);
  }
}

export const supabase = clientInstance;
export const isSupabaseConfigured = !!(formattedUrl && supabaseAnonKey && clientInstance);
