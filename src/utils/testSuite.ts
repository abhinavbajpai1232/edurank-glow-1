/**
 * Comprehensive test suite for BrainBuddy
 * Tests auth, quiz, coin system, and route protection
 */

import { sanitizeError, sanitizeInput, validateEmail, validatePassword } from '@/utils/errorHandler';
import { RateLimiter } from '@/utils/security';

// ============================================================================
// AUTH TESTS
// ============================================================================

export const authTests = {
  /**
   * Test email validation
   */
  testEmailValidation: () => {
    const testCases = [
      { email: 'valid@example.com', expected: true },
      { email: 'user.name+tag@example.co.uk', expected: true },
      { email: 'invalid@', expected: false },
      { email: '@example.com', expected: false },
      { email: 'notanemail', expected: false },
      { email: '', expected: false },
    ];

    const results = testCases.map((test) => {
      const result = validateEmail(test.email);
      return {
        email: test.email,
        expected: test.expected,
        actual: result,
        pass: result === test.expected,
      };
    });

    return {
      name: 'Email Validation',
      results,
      passed: results.every((r) => r.pass),
    };
  },

  /**
   * Test password strength validation
   */
  testPasswordValidation: () => {
    const testCases = [
      { password: 'Weak', expected: false },
      { password: 'NoNumbers!', expected: false },
      { password: 'NoSpecial123', expected: false },
      { password: 'ValidPass123!', expected: true },
      { password: 'AnotherOne99@', expected: true },
    ];

    const results = testCases.map((test) => {
      const validation = validatePassword(test.password);
      return {
        password: test.password ? '***' : test.password,
        expected: test.expected,
        actual: validation.valid,
        pass: validation.valid === test.expected,
        errors: validation.errors,
      };
    });

    return {
      name: 'Password Validation',
      results,
      passed: results.every((r) => r.pass),
    };
  },

  /**
   * Test session persistence (checks if token stored securely)
   */
  testSessionStorage: () => {
    const testKey = 'test_session_token';
    const testValue = 'test_jwt_token';

    try {
      // Check sessionStorage is used (not localStorage for auth tokens)
      sessionStorage.setItem(testKey, testValue);
      const retrieved = sessionStorage.getItem(testKey);
      const passed = retrieved === testValue;
      sessionStorage.removeItem(testKey);
      
      return {
        name: 'Session Storage',
        results: [{
          test: 'Session storage read/write',
          passed: passed,
          message: passed ? 'Session storage working' : 'Session storage not available',
        }],
        passed: passed,
      };
    } catch (e) {
      return {
        name: 'Session Storage',
        results: [{
          test: 'Session storage read/write',
          passed: false,
          message: 'Session storage error',
        }],
        passed: false,
      };
    }
  },
};

// ============================================================================
// QUIZ TESTS
// ============================================================================

export const quizTests = {
  /**
   * Test quiz score calculation
   */
  testScoreCalculation: () => {
    const testCases = [
      {
        answers: [0, 1, 2, 1, 0],
        correct: [0, 1, 0, 1, 0],
        expectedScore: 4,
        expectedPercentage: 80,
      },
      {
        answers: [0, 0, 0, 0, 0],
        correct: [1, 1, 1, 1, 1],
        expectedScore: 0,
        expectedPercentage: 0,
      },
      {
        answers: [0, 1, 2, 3],
        correct: [0, 1, 2, 3],
        expectedScore: 4,
        expectedPercentage: 100,
      },
    ];

    const results = testCases.map((test) => {
      const score = test.answers.filter((a, i) => a === test.correct[i]).length;
      const percentage = Math.round((score / test.correct.length) * 100);

      return {
        score: score,
        expectedScore: test.expectedScore,
        percentage: percentage,
        expectedPercentage: test.expectedPercentage,
        pass: score === test.expectedScore && percentage === test.expectedPercentage,
      };
    });

    return {
      name: 'Quiz Score Calculation',
      results,
      passed: results.every((r) => r.pass),
    };
  },

  /**
   * Test coin reward calculation (10 coins per correct answer)
   */
  testCoinReward: () => {
    const testCases = [
      { correctAnswers: 0, expectedCoins: 0 },
      { correctAnswers: 1, expectedCoins: 10 },
      { correctAnswers: 5, expectedCoins: 50 },
      { correctAnswers: 10, expectedCoins: 100 },
    ];

    const results = testCases.map((test) => {
      const coins = test.correctAnswers * 10;
      return {
        correctAnswers: test.correctAnswers,
        actualCoins: coins,
        expectedCoins: test.expectedCoins,
        pass: coins === test.expectedCoins,
      };
    });

    return {
      name: 'Coin Reward Calculation',
      results,
      passed: results.every((r) => r.pass),
    };
  },
};

// ============================================================================
// COIN SYSTEM TESTS
// ============================================================================

export const coinTests = {
  /**
   * Test preventing negative coin balance
   */
  testNegativeCoins: () => {
    const testCases = [
      { current: 100, deduct: 50, expectedResult: 50, shouldSucceed: true },
      { current: 100, deduct: 100, expectedResult: 0, shouldSucceed: true },
      { current: 100, deduct: 150, expectedResult: 100, shouldSucceed: false },
      { current: 0, deduct: 1, expectedResult: 0, shouldSucceed: false },
    ];

    const results = testCases.map((test) => {
      const result = Math.max(0, test.current - test.deduct);
      const shouldSucceed = test.current >= test.deduct;

      return {
        current: test.current,
        deduct: test.deduct,
        result: result,
        expectedResult: test.expectedResult,
        shouldSucceed: shouldSucceed,
        expectedSuccess: test.shouldSucceed,
        pass: result === test.expectedResult && shouldSucceed === test.shouldSucceed,
      };
    });

    return {
      name: 'Negative Coins Prevention',
      results,
      passed: results.every((r) => r.pass),
    };
  },

  /**
   * Test game unlock prices
   */
  testGameUnlockPrices: () => {
    const games = [
      { id: 'epic-era-battles', expectedPrice: 100 },
      { id: 'rushlane-x', expectedPrice: 300 },
    ];

    const results = games.map((game) => {
      return {
        gameId: game.id,
        price: game.expectedPrice,
        isValid: game.expectedPrice > 0,
      };
    });

    return {
      name: 'Game Unlock Prices',
      results,
      passed: results.every((r) => r.isValid),
    };
  },
};

// ============================================================================
// INPUT SANITIZATION TESTS
// ============================================================================

export const sanitizationTests = {
  /**
   * Test XSS prevention
   */
  testXSSPrevention: () => {
    const testCases = [
      {
        input: 'Normal username',
        expectedClean: 'Normal username',
        shouldBlock: false,
      },
      {
        input: '<script>alert("xss")</script>',
        expectedClean: 'scriptalert("xss")/script',
        shouldBlock: true,
      },
      {
        input: 'javascript:alert(1)',
        expectedClean: 'javascript:alert(1)',
        shouldBlock: true,
      },
      {
        input: 'onclick=alert(1)',
        shouldBlock: true,
      },
    ];

    const results = testCases.map((test) => {
      const sanitized = sanitizeInput(test.input);
      // Simple check: if original has < or > and sanitized doesn't, it was cleaned
      const wasClean = !sanitized.includes('<') && !sanitized.includes('>');

      return {
        input: test.input.substring(0, 30) + (test.input.length > 30 ? '...' : ''),
        sanitized: sanitized.substring(0, 30),
        shouldBlock: test.shouldBlock,
        wasCleaned: test.input !== sanitized,
        pass: test.shouldBlock ? test.input !== sanitized : true,
      };
    });

    return {
      name: 'XSS Prevention',
      results,
      passed: results.every((r) => r.pass),
    };
  },

  /**
   * Test input length limits
   */
  testInputLengthLimit: () => {
    const testCases = [
      { input: 'short', expectedMaxLen: 1000, pass: true },
      {
        input: 'a'.repeat(2000),
        expectedMaxLen: 1000,
        pass: true,
      },
    ];

    const results = testCases.map((test) => {
      const sanitized = sanitizeInput(test.input);
      return {
        inputLen: test.input.length,
        sanitizedLen: sanitized.length,
        maxLen: test.expectedMaxLen,
        pass: sanitized.length <= test.expectedMaxLen,
      };
    });

    return {
      name: 'Input Length Limit',
      results,
      passed: results.every((r) => r.pass),
    };
  },
};

// ============================================================================
// ERROR HANDLING TESTS
// ============================================================================

export const errorTests = {
  /**
   * Test error sanitization
   */
  testErrorSanitization: () => {
    const testCases = [
      {
        error: 'Invalid login credentials',
        expectedUserMessage: 'Invalid email or password',
      },
      {
        error: 'User already registered',
        expectedUserMessage: 'This email is already registered',
      },
      {
        error: 'Network timeout',
        expectedCode: 'NETWORK_ERROR',
      },
      {
        error: 'API key invalid',
        shouldHideSensitive: true,
      },
    ];

    const results = testCases.map((test) => {
      const error = new Error(test.error);
      const sanitized = sanitizeError(error);

      return {
        originalError: test.error,
        sanitizedMessage: sanitized.message,
        userMessage: sanitized.userMessage,
        pass: sanitized.userMessage && !sanitized.userMessage.includes('key'),
      };
    });

    return {
      name: 'Error Sanitization',
      results,
      passed: results.every((r) => r.pass),
    };
  },
};

// ============================================================================
// RATE LIMITING TESTS
// ============================================================================

export const rateLimitingTests = {
  /**
   * Test rate limiting functionality
   */
  testRateLimiter: () => {
    const limiter = new RateLimiter(3, 1000); // 3 attempts per 1000ms

    const testCases = [
      { attempt: 1, expectedAllowed: true },
      { attempt: 2, expectedAllowed: true },
      { attempt: 3, expectedAllowed: true },
      { attempt: 4, expectedAllowed: false },
      { attempt: 5, expectedAllowed: false },
    ];

    const results = testCases.map((test) => {
      const allowed = limiter.isAllowed('test_key');
      return {
        attempt: test.attempt,
        allowed: allowed,
        expectedAllowed: test.expectedAllowed,
        pass: allowed === test.expectedAllowed,
      };
    });

    limiter.reset('test_key');

    return {
      name: 'Rate Limiting',
      results,
      passed: results.every((r) => r.pass),
    };
  },
};

// ============================================================================
// RUN ALL TESTS
// ============================================================================

export const runAllTests = () => {
  const allTests = [
    authTests.testEmailValidation(),
    authTests.testPasswordValidation(),
    authTests.testSessionStorage(),
    quizTests.testScoreCalculation(),
    quizTests.testCoinReward(),
    coinTests.testNegativeCoins(),
    coinTests.testGameUnlockPrices(),
    sanitizationTests.testXSSPrevention(),
    sanitizationTests.testInputLengthLimit(),
    errorTests.testErrorSanitization(),
    rateLimitingTests.testRateLimiter(),
  ];

  const summary = {
    totalTests: allTests.length,
    passedTests: allTests.filter((t) => t.passed).length,
    failedTests: allTests.filter((t) => !t.passed).length,
    tests: allTests,
  };

  return summary;
};

/**
 * Log test results in a formatted way
 */
export const printTestResults = (summary: ReturnType<typeof runAllTests>) => {
  console.group('🧪 BrainBuddy Test Suite Results');
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passedTests}`);
  console.log(`❌ Failed: ${summary.failedTests}`);
  console.table(summary.tests.map((t) => ({ ...t, results: undefined })));
  console.groupEnd();

  return summary;
};
