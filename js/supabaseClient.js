// Optional accounts/sync backend. Fill in SUPABASE_URL and SUPABASE_ANON_KEY after creating a
// Supabase project (see supabase/schema.sql for the one-time setup). Both values are public and
// safe to ship client-side — Row Level Security on the tables is what actually protects the data.
// Leaving them blank keeps the app fully local/offline with no account features shown.
const SUPABASE_URL = "https://jntmikytaemkmhoqhfgh.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7w8kNdMn7OEqh6UU6oed2A_SH7xgnVK";

const supabaseClient =
  SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase
    ? // pkce flow returns "?code=..." on the OAuth redirect back instead of a "#access_token=..."
      // fragment, so it can't collide with the app's own hash-based router (location.hash).
      window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { flowType: "pkce" } })
    : null;
