import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase Environment Variables');
    console.error('URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('Key:', supabaseAnonKey ? 'Set' : 'Missing');
} else {
    console.log('Supabase client initialized successfully');
    console.log('URL:', supabaseUrl);
}

// Custom fetch with timeout and retry logic to handle slow connections
const customFetch = async (url: RequestInfo | URL, options: RequestInit = {}) => {
    const maxRetries = 2;
    const timeout = 30000; // 30 second timeout (increased from 10s)

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error: any) {
            clearTimeout(timeoutId);

            // If this was the last attempt, throw the error
            if (attempt === maxRetries) {
                console.error(`Fetch failed after ${maxRetries + 1} attempts:`, error);
                throw error;
            }

            // Wait before retrying (exponential backoff: 1s, 2s)
            const waitTime = Math.pow(2, attempt) * 1000;
            console.warn(`Fetch attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }

    throw new Error('Fetch failed after all retries');
};

// Health check function to test Supabase connectivity
export const checkSupabaseHealth = async (): Promise<{ healthy: boolean; message: string }> => {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(supabaseUrl, {
            signal: controller.signal,
            method: 'HEAD'
        });

        clearTimeout(timeoutId);

        if (response.ok || response.status === 404) {
            return { healthy: true, message: 'Supabase is reachable' };
        }

        return { healthy: false, message: `Supabase returned status ${response.status}` };
    } catch (error: any) {
        if (error.name === 'AbortError') {
            return { healthy: false, message: 'Connection timeout - Supabase is not responding' };
        }
        return { healthy: false, message: `Connection error: ${error.message}` };
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
    },
    global: {
        fetch: customFetch,
    },
});
