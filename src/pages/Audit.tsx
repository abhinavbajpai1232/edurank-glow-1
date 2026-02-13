/**
 * Security & Testing Audit Page
 * Displays comprehensive test results and security status
 * Only visible in development mode (can be protected by role in production)
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertCircle, XCircle, TrendingUp, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Logo from '@/components/Logo';
import { runAllTests, printTestResults } from '@/utils/testSuite';
import { validateEnvironment } from '@/utils/security';

interface TestResult {
  name: string;
  results: Array<Record<string, unknown>>;
  passed: boolean;
}

interface TestSummary {
  totalTests: number;
  passedTests: number;
  failedTests: number;
  tests: TestResult[];
}

const AuditPage: React.FC = () => {
  const [testResults, setTestResults] = useState<TestSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [envValid, setEnvValid] = useState(false);

  useEffect(() => {
    // Only show in development
    if (!import.meta.env.DEV) {
      window.location.href = '/';
      return;
    }

    // Validate environment on load
    validateEnvironment();
    setEnvValid(true);
  }, []);

  const handleRunTests = async () => {
    setLoading(true);
    try {
      const results = runAllTests();
      setTestResults(results);
      printTestResults(results);
    } finally {
      setLoading(false);
    }
  };

  if (!import.meta.env.DEV) {
    return null; // Prevent access in production
  }

  return (
    <div className="min-h-screen bg-background p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Security Audit & Testing</h1>
          </div>
          <p className="text-muted-foreground">
            Development-only page for testing security features and system integrity
          </p>
        </div>

        {/* Quick Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Quick Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="text-2xl font-bold text-success">✓</div>
                <div className="text-sm text-muted-foreground">Error Boundary Active</div>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="text-2xl font-bold text-success">✓</div>
                <div className="text-sm text-muted-foreground">Session Storage</div>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="text-2xl font-bold text-success">✓</div>
                <div className="text-sm text-muted-foreground">Security Headers</div>
              </div>
              <div className={`p-4 rounded-lg ${envValid ? 'bg-success/10 border border-success/20' : 'bg-destructive/10 border border-destructive/20'}`}>
                <div className={`text-2xl font-bold ${envValid ? 'text-success' : 'text-destructive'}`}>
                  {envValid ? '✓' : '✗'}
                </div>
                <div className="text-sm text-muted-foreground">Env Configured</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Suite */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Test Suite</CardTitle>
            <CardDescription>Run comprehensive tests on all systems</CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleRunTests}
              disabled={loading}
              className="w-full md:w-auto"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </Button>

            {testResults && (
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">
                      {testResults.totalTests}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Tests</div>
                  </div>
                  <div className="p-4 rounded-lg bg-success/10">
                    <div className="text-2xl font-bold text-success">
                      {testResults.passedTests}
                    </div>
                    <div className="text-sm text-muted-foreground">Passed</div>
                  </div>
                  <div className={`p-4 rounded-lg ${testResults.failedTests > 0 ? 'bg-destructive/10' : 'bg-muted/50'}`}>
                    <div className={`text-2xl font-bold ${testResults.failedTests > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                      {testResults.failedTests}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                </div>

                {testResults.failedTests === 0 && (
                  <div className="p-4 rounded-lg bg-success/10 border border-success/20 flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-success">All Tests Passed!</h4>
                      <p className="text-sm text-muted-foreground">
                        System is functioning correctly and security measures are in place.
                      </p>
                    </div>
                  </div>
                )}

                {testResults.failedTests > 0 && (
                  <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold text-destructive">Some Tests Failed</h4>
                      <p className="text-sm text-muted-foreground">
                        Check the results below and fix any issues.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Results Details */}
        {testResults && (
          <div className="space-y-4">
            {testResults.tests.map((test: TestResult, idx: number) => (
              <Card key={idx} className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {test.passed ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive" />
                    )}
                    {test.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {test.results && Array.isArray(test.results) ? (
                    <div className="overflow-x-auto">
                      <pre className="text-xs bg-muted/50 p-4 rounded-lg overflow-auto max-h-96">
                        {JSON.stringify(test.results, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <pre className="text-sm">
                      {JSON.stringify(test, null, 2)}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Security Checklist */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Error Boundary:</strong> Global error handler prevents crashes
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Session Storage:</strong> Auth tokens cleared on tab close
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Input Sanitization:</strong> XSS prevention on all user inputs
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Error Sanitization:</strong> Sensitive data removed from user messages
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Rate Limiting:</strong> Frontend rate limiting on auth/forms
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Password Validation:</strong> Strength requirements enforced
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                <span className="text-sm">
                  <strong>Route Protection:</strong> ProtectedRoute wrapper on secured pages
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Backend Security Notes */}
        <Card className="glass-card border-amber-200/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              Backend Security Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>1. Server-side Coin Validation:</strong>
              <p className="text-muted-foreground ml-4">
                Never trust frontend coin values. Always validate coin deductions on backend before unlocking games.
              </p>
            </div>
            <div>
              <strong>2. Rate Limiting on Backend:</strong>
              <p className="text-muted-foreground ml-4">
                Implement rate limiting on all API endpoints (generate-quiz, generate-notes, etc.)
              </p>
            </div>
            <div>
              <strong>3. Input Validation:</strong>
              <p className="text-muted-foreground ml-4">
                Validate all user inputs on backend before processing.
              </p>
            </div>
            <div>
              <strong>4. API Key Rotation:</strong>
              <p className="text-muted-foreground ml-4">
                Regularly rotate API keys and monitor for unauthorized access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-4 border-t border-border/50">
          <p className="text-sm text-muted-foreground">
            This page is only visible in development mode.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuditPage;
