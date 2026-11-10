const { createClient } = require('@supabase/supabase-js');
const supabase = createClient('https://iuoxkoburrtmjajfrsdb.supabase.co', (process.env.SUPABASE_SERVICE_ROLE_KEY || ""));

async function run() {
  const { data, error } = await supabase.rpc('get_public_page', { p_slug: 'gocafe' });
  console.log('get_public_page gocafe:', JSON.stringify(data, null, 2), error);
}
run();
