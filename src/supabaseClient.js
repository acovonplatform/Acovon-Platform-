import { createClient } from "@supabase/supabase-js";

// ============================================================================
// PASTE YOUR SUPABASE URL AND PUBLIC KEY BELOW:
// (Note: Base project URL is https://jggfwquxgrkbuvwnkmgv.supabase.co)
// ============================================================================
export const SUPABASE_URL = "https://jggfwquxgrkbuvwnkmgv.supabase.co";
export const SUPABASE_PUBLIC_KEY = "sb_publishable_krAhRrvHDOYt31-_1st3ng_oHL1b4Pu";

// Supabase Auth OAuth 2.0 / OIDC Discovery Endpoints
export const SUPABASE_AUTH_ENDPOINTS = {
  authorizationEndpoint: "https://jggfwquxgrkbuvwnkmgv.supabase.co/auth/v1/oauth/authorize",
  tokenEndpoint: "https://jggfwquxgrkbuvwnkmgv.supabase.co/auth/v1/oauth/token",
  jwksEndpoint: "https://jggfwquxgrkbuvwnkmgv.supabase.co/auth/v1/.well-known/jwks.json",
  oidcDiscovery: "https://jggfwquxgrkbuvwnkmgv.supabase.co/auth/v1/.well-known/openid-configuration",
};

// Normalize URL if "/rest/v1/" or "/auth/v1/..." is included so Auth, Database, and Storage all work seamlessly
const normalizedSupabaseUrl = SUPABASE_URL.replace(/\/(rest|auth)\/v1.*$/, "");

export const supabase = createClient(normalizedSupabaseUrl, SUPABASE_PUBLIC_KEY, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});
