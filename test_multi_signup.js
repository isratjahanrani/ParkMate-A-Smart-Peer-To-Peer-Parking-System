
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://mhiourrkuoykqashvidl.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1oaW91cnJrdW95a3Fhc2h2aWRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1MzM0ODMsImV4cCI6MjA4MTEwOTQ4M30.Fj1bSChyWxhsx-StfmOQnH9rR8MCpSmRZ0CjIpcMoJ0";

const supabase = createClient(supabaseUrl, supabaseKey);

async function signupUser(idx) {
    const email = `host.test.${Date.now()}.${idx}@gmail.com`;
    const password = 'password123';

    console.log(`\n--- Attempting signup ${idx}: ${email} ---`);

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                role: 'host',
                full_name: `Test Host ${idx}`,
                phone: `123456789${idx}`,
                business_name: `Biz ${idx}`,
                address: `Address ${idx}`,
                initial_property_type: 'garage',
                initial_capacity: '5',
                description: 'A dedicated test host.'
            }
        }
    });

    if (error) {
        console.error(`ERROR for ${idx}:`, error.message);
        console.error(JSON.stringify(error, null, 2));
    } else {
        console.log(`SUCCESS for ${idx}. User ID:`, data.user?.id);

        // Check DB
        if (data.user) {
            const { data: profile, error: pErr } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', data.user.id);

            if (pErr) console.error('Profile fetch error:', pErr);
            else console.log('Profile created:', profile.length > 0);
        }
    }
}

async function run() {
    await signupUser(1);
    // Wait a bit just in case
    await new Promise(r => setTimeout(r, 1000));
    await signupUser(2);
}

run();
