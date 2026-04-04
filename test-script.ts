import { supabase } from './src/lib/supabase.ts';

async function test() {
   const { data, error } = await supabase.from('installments').select('*').limit(1);
   console.log('Installment Schema Check:', data, error);
}

test();
