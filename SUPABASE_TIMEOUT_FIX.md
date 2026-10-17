# Supabase Connection Timeout Fix

## Problem
The application was experiencing timeout errors when trying to connect to Supabase:
- Session check timeouts in `App.tsx`
- Login timeouts in `LoginPage.tsx`
- Supabase not responding within the configured timeframes

## Changes Made

### 1. Enhanced Supabase Client (`src/lib/supabase.ts`)
- **Increased timeout**: From 10s to 30s
- **Added retry logic**: Automatically retries failed requests up to 2 times with exponential backoff (1s, 2s)
- **Added health check function**: `checkSupabaseHealth()` to test connectivity before attempting auth

### 2. Updated App.tsx
- **Increased session check timeout**: From 8s to 20s
- **Increased role fetch timeout**: From 5s to 10s
- **Better error logging**: Added emoji indicators for easier debugging

### 3. Updated LoginPage.tsx
- **Added pre-login health check**: Tests Supabase connectivity before attempting login
- **Increased login timeout**: From 15s to 30s (matches fetch timeout)
- **Increased role fetch timeout**: From 8s to 15s
- **Better error messages**: More descriptive error messages with troubleshooting hints

### 4. Created Diagnostics Page
- **New route**: `/diagnostics`
- **Comprehensive testing**: Tests internet, Supabase URL, auth, database, and network speed
- **Visual feedback**: Color-coded results with detailed timing information
- **Troubleshooting tips**: Built-in guidance for common issues

## How to Use

### Access the Diagnostics Page
1. Navigate to `http://localhost:5173/diagnostics` in your browser
2. Click "Run Diagnostics"
3. Review the test results to identify connection issues

### What the Tests Check
1. **Internet Connectivity**: Verifies you have an active internet connection
2. **Supabase URL Reachability**: Tests if Supabase server is accessible
3. **Auth Session Check**: Verifies authentication system is working
4. **Database Query**: Tests database access permissions
5. **Network Speed Estimate**: Measures your connection speed

### Interpreting Results
- ✅ **Green (Success)**: Test passed, no issues
- ⚠️ **Yellow (Warning)**: Test passed but with concerns (e.g., slow connection)
- ❌ **Red (Error)**: Test failed, needs attention

## Timeout Configuration

Current timeout settings:
- **Fetch timeout**: 30 seconds (with 2 retries)
- **Login timeout**: 30 seconds
- **Session check timeout**: 20 seconds
- **Role fetch timeout**: 10-15 seconds

## Troubleshooting

### If you still experience timeouts:

1. **Check your internet connection**
   - Run the diagnostics page
   - Look for "Internet Connectivity" test result

2. **Check if Supabase is blocked**
   - Some firewalls or proxies may block Supabase
   - Try accessing `https://mhiourrkuoykqashvidl.supabase.co` directly in your browser
   - Contact your network administrator if blocked

3. **Slow network connection**
   - The diagnostics page will show your network speed
   - If speed is < 50 KB/s, consider using a better connection
   - You may need to increase timeouts further for very slow connections

4. **Supabase service issues**
   - Check Supabase status page: https://status.supabase.com
   - Check your Supabase project dashboard for any alerts

### Adjusting Timeouts

If you need to adjust timeouts further, edit these files:

**`src/lib/supabase.ts`**:
```typescript
const timeout = 30000; // Increase this value (in milliseconds)
```

**`src/App.tsx`**:
```typescript
setTimeout(() => reject(new Error('Session check timeout')), 20000) // Increase this
```

**`src/components/pages/LoginPage.tsx`**:
```typescript
setTimeout(() => reject(new Error('LOGIN_TIMEOUT')), 30000) // Increase this
```

## Next Steps

1. Run the diagnostics page to identify the specific issue
2. Based on results, either:
   - Fix network/firewall issues
   - Increase timeouts if connection is slow but working
   - Contact Supabase support if their service is down

## Development Mode

If you need to bypass Supabase for development:

1. Set `DEV_MODE = true` in `App.tsx` (line 53)
2. Set `DEV_MODE = true` in `LoginPage.tsx` (line 30)
3. Use email: `robiulislamtamim12345@gmail.com`

This will use localStorage instead of Supabase for authentication.
