import {
  circuitBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleAll,
  retry,
  wrap,
} from 'cockatiel';

export interface ResilienceConfig {
  retries?: number;
  backoffInitialDelay?: number;
  backoffMaxDelay?: number;
  circuitBreakerThreshold?: number;
  circuitBreakerDuration?: number;
}

const defaultConfig: Required<ResilienceConfig> = {
  retries: 3,
  backoffInitialDelay: 100,
  backoffMaxDelay: 5000,
  circuitBreakerThreshold: 5,
  circuitBreakerDuration: 30000, // 30 seconds
};

export function createResiliencePolicy(config?: ResilienceConfig) {
  const finalConfig = { ...defaultConfig, ...config };

  // Retry policy with exponential backoff
  const retryPolicy = retry(handleAll, {
    maxAttempts: finalConfig.retries,
    backoff: new ExponentialBackoff({
      initialDelay: finalConfig.backoffInitialDelay,
      maxDelay: finalConfig.backoffMaxDelay,
    }),
  });

  // Circuit breaker policy
  const breakerPolicy = circuitBreaker(handleAll, {
    halfOpenAfter: finalConfig.circuitBreakerDuration,
    breaker: new ConsecutiveBreaker(finalConfig.circuitBreakerThreshold),
  });

  // Combine policies: circuit breaker wraps retry
  return wrap(breakerPolicy, retryPolicy);
}
