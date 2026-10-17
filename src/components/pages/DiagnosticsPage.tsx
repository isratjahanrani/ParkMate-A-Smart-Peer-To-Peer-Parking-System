import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase, checkSupabaseHealth } from '@/lib/supabase';
import { Loader2, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
    name: string;
    status: 'pending' | 'success' | 'error' | 'warning';
    message: string;
    duration?: number;
}

export function DiagnosticsPage() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<TestResult[]>([]);

    const addResult = (result: TestResult) => {
        setResults(prev => [...prev, result]);
    };

    const runDiagnostics = async () => {
        setIsRunning(true);
        setResults([]);

        // Test 1: Internet Connectivity
        addResult({ name: 'Internet Connectivity', status: 'pending', message: 'Checking...' });
        const internetStart = Date.now();
        try {
            await fetch('https://www.google.com', { method: 'HEAD', mode: 'no-cors' });
            addResult({
                name: 'Internet Connectivity',
                status: 'success',
                message: 'Internet connection is active',
                duration: Date.now() - internetStart
            });
        } catch (error) {
            addResult({
                name: 'Internet Connectivity',
                status: 'error',
                message: 'No internet connection detected'
            });
        }

        // Test 2: Supabase URL Reachability
        addResult({ name: 'Supabase URL Reachability', status: 'pending', message: 'Checking...' });
        const healthStart = Date.now();
        const health = await checkSupabaseHealth();
        addResult({
            name: 'Supabase URL Reachability',
            status: health.healthy ? 'success' : 'error',
            message: health.message,
            duration: Date.now() - healthStart
        });

        if (!health.healthy) {
            setIsRunning(false);
            return;
        }

        // Test 3: Auth Session Check
        addResult({ name: 'Auth Session Check', status: 'pending', message: 'Checking...' });
        const sessionStart = Date.now();
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;

            addResult({
                name: 'Auth Session Check',
                status: 'success',
                message: data.session ? 'Active session found' : 'No active session (expected)',
                duration: Date.now() - sessionStart
            });
        } catch (error: any) {
            addResult({
                name: 'Auth Session Check',
                status: 'error',
                message: `Failed: ${error.message}`,
                duration: Date.now() - sessionStart
            });
        }

        // Test 4: Database Query
        addResult({ name: 'Database Query', status: 'pending', message: 'Checking...' });
        const dbStart = Date.now();
        try {
            const { data, error } = await supabase
                .from('users')
                .select('count')
                .limit(1);

            if (error) throw error;

            addResult({
                name: 'Database Query',
                status: 'success',
                message: 'Database is accessible',
                duration: Date.now() - dbStart
            });
        } catch (error: any) {
            addResult({
                name: 'Database Query',
                status: 'error',
                message: `Failed: ${error.message}`,
                duration: Date.now() - dbStart
            });
        }

        // Test 5: Network Speed Estimate
        addResult({ name: 'Network Speed Estimate', status: 'pending', message: 'Checking...' });
        const speedStart = Date.now();
        try {
            const response = await fetch('https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png');
            const blob = await response.blob();
            const duration = Date.now() - speedStart;
            const sizeKB = blob.size / 1024;
            const speedKBps = sizeKB / (duration / 1000);

            let status: 'success' | 'warning' | 'error' = 'success';
            let message = `~${speedKBps.toFixed(0)} KB/s`;

            if (speedKBps < 50) {
                status = 'error';
                message += ' (Very slow connection)';
            } else if (speedKBps < 200) {
                status = 'warning';
                message += ' (Slow connection)';
            } else {
                message += ' (Good connection)';
            }

            addResult({
                name: 'Network Speed Estimate',
                status,
                message,
                duration
            });
        } catch (error) {
            addResult({
                name: 'Network Speed Estimate',
                status: 'error',
                message: 'Could not estimate speed'
            });
        }

        setIsRunning(false);
    };

    const getStatusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'pending':
                return <Loader2 className="w-5 h-5 animate-spin text-blue-500" />;
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-500" />;
            case 'error':
                return <XCircle className="w-5 h-5 text-red-500" />;
        }
    };

    const getStatusColor = (status: TestResult['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-blue-50 border-blue-200';
            case 'success':
                return 'bg-green-50 border-green-200';
            case 'warning':
                return 'bg-yellow-50 border-yellow-200';
            case 'error':
                return 'bg-red-50 border-red-200';
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Supabase Connection Diagnostics
                    </h1>
                    <p className="text-gray-600 mb-8">
                        Run comprehensive tests to diagnose connection issues with Supabase
                    </p>

                    <Button
                        onClick={runDiagnostics}
                        disabled={isRunning}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 h-12 rounded-lg mb-8"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                Running Diagnostics...
                            </>
                        ) : (
                            'Run Diagnostics'
                        )}
                    </Button>

                    {results.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h2>
                            {results.map((result, index) => (
                                <div
                                    key={index}
                                    className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(result.status)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        {getStatusIcon(result.status)}
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900">{result.name}</h3>
                                            <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                                            {result.duration !== undefined && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    Completed in {result.duration}ms
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {results.length === 0 && !isRunning && (
                        <div className="text-center py-12 text-gray-500">
                            <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
                            <p>Click "Run Diagnostics" to start testing your connection</p>
                        </div>
                    )}

                    <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                        <h3 className="font-semibold text-blue-900 mb-2">💡 Troubleshooting Tips</h3>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>If internet connectivity fails, check your network connection</li>
                            <li>If Supabase URL is unreachable, check if you're behind a firewall or proxy</li>
                            <li>Slow network speeds may cause timeouts - consider using a better connection</li>
                            <li>Database query failures may indicate permission issues or incorrect setup</li>
                        </ul>
                    </div>

                    <div className="mt-4 p-4 bg-gray-50 border-2 border-gray-200 rounded-lg">
                        <h3 className="font-semibold text-gray-900 mb-2">📊 Configuration</h3>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><strong>Supabase URL:</strong> {import.meta.env.VITE_SUPABASE_URL || 'Not set'}</p>
                            <p><strong>Fetch Timeout:</strong> 30 seconds (with retry)</p>
                            <p><strong>Login Timeout:</strong> 30 seconds</p>
                            <p><strong>Session Check Timeout:</strong> 20 seconds</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
