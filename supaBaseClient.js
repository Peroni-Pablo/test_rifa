const SUPABASE_URL = "https://npfyifrzlvdgymkotybh.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wZnlpZnJ6bHZkZ3lta290eWJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzU4NTgsImV4cCI6MjA4ODgxMTg1OH0.RwW9FzFZFWS8Uu_knGuoPb-wGjADTA_3fO1a8FgBFl4";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);