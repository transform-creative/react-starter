import "@testing-library/jest-dom";

// Supabase client constructs eagerly on import — give it placeholder values so
// unit tests don't need real Supabase credentials.
process.env.VITE_SUPABASE_URL ||= "http://localhost:54321";
process.env.VITE_SUPABASE_ANON_KEY ||= "test-anon-key";
import.meta.env.VITE_SUPABASE_URL ||= "http://localhost:54321";
import.meta.env.VITE_SUPABASE_ANON_KEY ||= "test-anon-key";
