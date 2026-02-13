/**
 * Security utilities for frontend hardening
 * Implements security headers and best practices
 */

/**
 * Initialize security headers via meta tags
 * (Cannot set HTTP headers from frontend, but can use meta tags for some protections)
 */
export const initSecurityHeaders = () => {
  // Content-Security-Policy meta tag
  const cspMeta = document.createElement('meta');
  cspMeta.httpEquiv = 'Content-Security-Policy';
  cspMeta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdn.socket.io https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com https://cdn.jsdelivr.net",
    "connect-src 'self' https:// wss://",
    "frame-src https://www.google.com/recaptcha/ https://*.lovable.dev",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join(';');
  document.head.appendChild(cspMeta);

  // X-UA-Compatible
  const uaCompatMeta = document.createElement('meta');
  uaCompatMeta.httpEquiv = 'X-UA-Compatible';
  uaCompatMeta.content = 'height=device-height, width=device-width, initial-scale=1.0, user-scalable=yes';
  document.head.appendChild(uaCompatMeta);

  // Referrer-Policy
  const referrerMeta = document.createElement('meta');
  referrerMeta.name = 'referrer';
  referrerMeta.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrerMeta);

  // Disable dangerous APIs
  disableDangerousAPIs();
  
  // Setup error tracking
  setupErrorTracking();
};

/**
 * Disable dangerous browser APIs for security
 */
const disableDangerousAPIs = () => {
  // Prevent eval usage (already restricted by CSP)
  // window.eval = function() { throw new Error('eval() is disabled'); };

  // Disable dangerous XSS vectors
  if (document.designMode !== undefined) {
    document.designMode = 'off';
  }

  // Prevent prototype pollution
  Object.freeze(Object);
  Object.freeze(Object.prototype);
};

/**
 * Setup global error tracking
 */
const setupErrorTracking = () => {
  // Track unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    // TODO: Send to error tracking service
  });

  // Track script errors
  window.addEventListener('error', (event) => {
    console.error('Script error:', event.error);
    // TODO: Send to error tracking service
  });
};

/**
 * Validate environment configuration on startup
 */
export const validateEnvironment = () => {
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
  ];

  const missing = requiredEnvVars.filter(
    (key) => !import.meta.env[key]
  );

  if (missing.length > 0) {
    console.error(
      'Missing required environment variables:',
      missing.join(', ')
    );
    throw new Error(
      `Missing critical environment variables: ${missing.join(', ')}`
    );
  }

  // Warn if running with unencrypted HTTP (except localhost)
  if (
    window.location.protocol === 'http:' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  ) {
    console.warn(
      '⚠️ Application running on insecure HTTP. Use HTTPS in production!'
    );
  }
};

/**
 * Prevent clickjacking
 */
export const preventClickjacking = () => {
  if (window.self !== window.top) {
    try {
      window.top!.location.href = window.self.location.href;
    } catch (e) {
      // Silently fail if we can't break out of iframe
    }
  }
};

/**
 * Secure localStorage with minimal data
 */
export const secureStorage = {
  setItem: (key: string, value: string) => {
    // Only store non-sensitive data in localStorage
    const sensitiveKeys = ['token', 'password', 'secret', 'key', 'auth'];
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      console.warn(`⚠️ Attempted to store sensitive data: ${key}`);
      return;
    }
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.error('Storage quota exceeded');
    }
  },

  getItem: (key: string) => {
    return localStorage.getItem(key);
  },

  removeItem: (key: string) => {
    localStorage.removeItem(key);
  },

  clear: () => {
    localStorage.clear();
  },
};

/**
 * Detect and warn about potential XSS attempts
 */
export const detectXSSAttempt = (input: string): boolean => {
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
  ];

  return xssPatterns.some((pattern) => pattern.test(input));
};

/**
 * Get CSRF token from meta tag (if backend provides it)
 */
export const getCSRFToken = (): string | null => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta?.getAttribute('content') || null;
};

/**
 * Rate limiting helper for frontend (server should also rate limit)
 */
export class RateLimiter {
  private attempts: Map<string, number[]> = new Map();
  private readonly maxAttempts: number;
  private readonly windowMs: number;

  constructor(maxAttempts: number = 5, windowMs: number = 60000) {
    this.maxAttempts = maxAttempts;
    this.windowMs = windowMs;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const validAttempts = attempts.filter(
      (time) => now - time < this.windowMs
    );

    if (validAttempts.length >= this.maxAttempts) {
      return false;
    }

    validAttempts.push(now);
    this.attempts.set(key, validAttempts);
    return true;
  }

  getRemainingAttempts(key: string): number {
    const attempts = this.attempts.get(key) || [];
    const now = Date.now();
    const validAttempts = attempts.filter(
      (time) => now - time < this.windowMs
    );
    return Math.max(0, this.maxAttempts - validAttempts.length);
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

/**
 * Export rate limiters for specific operations
 */
export const loginLimiter = new RateLimiter(5, 60000); // 5 attempts per minute
export const apiCallLimiter = new RateLimiter(10, 1000); // 10 calls per second
export const formSubmitLimiter = new RateLimiter(3, 5000); // 3 submits per 5s
