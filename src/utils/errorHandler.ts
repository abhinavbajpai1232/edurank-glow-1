/**
 * Centralized error handling and sanitization
 * Prevents exposure of sensitive information (API keys, tokens, etc.)
 */

interface SanitizedError {
  message: string;
  code?: string;
  isNetwork?: boolean;
  isAuth?: boolean;
  userMessage: string;
}

/**
 * Sanitize error messages to prevent leaking sensitive data
 */
export const sanitizeError = (error: unknown): SanitizedError => {
  const defaultUserMessage = 'An error occurred. Please try again.';
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    
    // Auth errors
    if (message.includes('invalid login credentials') || message.includes('invalid_grant')) {
      return {
        message: 'Invalid email or password',
        code: 'AUTH_INVALID',
        isAuth: true,
        userMessage: 'Invalid email or password. Please try again.'
      };
    }
    // Supabase API key errors
    if (message.includes('invalid api key') || message.includes('invalid api')) {
      return {
        message: 'Invalid Supabase API key',
        code: 'INVALID_API_KEY',
        userMessage:
          'Developer: Supabase anon key is invalid. Update VITE_SUPABASE_ANON_KEY in your .env and restart the dev server.'
      };
    }
    
    if (message.includes('user already registered') || message.includes('duplicate')) {
      return {
        message: 'User already exists',
        code: 'AUTH_EXISTS',
        isAuth: true,
        userMessage: 'This email is already registered. Please sign in.'
      };
    }
    
    if (message.includes('invalid token') || message.includes('expired')) {
      return {
        message: 'Session expired',
        code: 'AUTH_EXPIRED',
        isAuth: true,
        userMessage: 'Your session has expired. Please sign in again.'
      };
    }
    
    // Network errors
    if (message.includes('fetch') || message.includes('network') || message.includes('timeout')) {
      return {
        message: 'Network error',
        code: 'NETWORK_ERROR',
        isNetwork: true,
        userMessage: 'Network connection failed. Please check your internet and try again.'
      };
    }
    
    // Rate limiting
    if (message.includes('rate limit') || message.includes('429')) {
      return {
        message: 'Rate limited',
        code: 'RATE_LIMITED',
        userMessage: 'Too many requests. Please wait a moment and try again.'
      };
    }
    
    // API errors
    if (message.includes('api')) {
      return {
        message: 'API error',
        code: 'API_ERROR',
        userMessage: 'Service temporarily unavailable. Please try again.'
      };
    }
    
    // Default to generic message if sensitive data detected
    if (
      message.includes('key') ||
      message.includes('secret') ||
      message.includes('token') ||
      message.includes('password') ||
      message.includes('credential')
    ) {
      return {
        message: 'Sensitive operation error',
        code: 'SENSITIVE_ERROR',
        userMessage: defaultUserMessage
      };
    }
    
    return {
      message: error.message,
      userMessage: error.message.length > 100 ? defaultUserMessage : error.message
    };
  }
  
  return {
    message: 'Unknown error',
    userMessage: defaultUserMessage
  };
};

/**
 * Structured error logging (prevents sensitive data in logs)
 */
export const logError = (
  error: unknown,
  context: string,
  meta?: Record<string, string | number | boolean>
): void => {
  const sanitized = sanitizeError(error);
  
  // Only log in development or to structured logging service
  if (import.meta.env.DEV) {
    console.error(`[${context}]`, {
      message: sanitized.message,
      code: sanitized.code,
      meta: meta ? JSON.stringify(meta) : undefined,
      timestamp: new Date().toISOString()
    });
  }
  
  // TODO: Send to error tracking service (Sentry, etc.) in production
};

/**
 * Handle async errors safely
 */
export const handleAsyncError = async <T>(
  promise: Promise<T>,
  errorContext: string
): Promise<{ data?: T; error?: SanitizedError }> => {
  try {
    const data = await promise;
    return { data };
  } catch (error) {
    const sanitized = sanitizeError(error);
    logError(error, errorContext);
    return { error: sanitized };
  }
};

/**
 * Validate and sanitize user input
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // Remove potential XSS vectors
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .substring(0, 1000); // Limit length
};

/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password strength requirements
 */
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};
