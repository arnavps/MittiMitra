import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string
);

async function applyMigrations() {
  const query = `
    ALTER TABLE profiles 
    ADD COLUMN IF NOT EXISTS crop text,
    ADD COLUMN IF NOT EXISTS yield_quintals numeric,
    ADD COLUMN IF NOT EXISTS harvest_status boolean,
    ADD COLUMN IF NOT EXISTS latitude numeric,
    ADD COLUMN IF NOT EXISTS longitude numeric,
    ADD COLUMN IF NOT EXISTS storage_type text,
    ADD COLUMN IF NOT EXISTS transport_type text,
    ADD COLUMN IF NOT EXISTS last_onboarding_step text;
  `;

  // Note: Anon key usually can't run raw SQL unless there's an RPC designed for it.
  // If no RPC, this won't work. We'll see.
  const { data, error } = await supabase.rpc('execute_sql', { query });
  console.log("Migration result:", { data, error });
}

applyMigrations();
