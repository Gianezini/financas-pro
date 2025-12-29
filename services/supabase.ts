
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dbnusibahcepatlhbebs.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_cEb1WY8hHvwQFUiSBqoIaw_2ECtphe7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
