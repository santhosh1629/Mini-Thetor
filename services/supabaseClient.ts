import { createClient } from '@supabase/supabase-js';

// Supabase configuration updated with user provided credentials
const supabaseUrl = 'https://jrfsgajtrkzgndtcuwhj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZnNnYWp0cmt6Z25kdGN1d2hqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0NzI5OTcsImV4cCI6MjA4MjA0ODk5N30.99G8bgMaEuM9nJwAhEgui3ByT09zCNjjPXKKV6AyALY';

export const supabase = createClient(supabaseUrl, supabaseKey);