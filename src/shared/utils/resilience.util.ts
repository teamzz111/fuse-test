import {
  circuitBreaker,
  ConsecutiveBreaker,
  ExponentialBackoff,
  handleWhen,
  retry,
  wrap,
} from 'cockatiel';
import { HttpException } from '@nestjs/common';

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
  circuitBreakerDuration: 30000,
};

export function createResiliencePolicy(config?: ResilienceConfig) {
  const finalConfig = { ...defaultConfig, ...config };

  const retryPolicy = retry(
    handleWhen((err) => {
      if (err instanceof HttpException) {
        const status = err.getStatus();
        return status >= 500 || status === 429;
      }
      return true;
    }),
    {
      maxAttempts: finalConfig.retries,
      backoff: new ExponentialBackoff({
        initialDelay: finalConfig.backoffInitialDelay,
        maxDelay: finalConfig.backoffMaxDelay,
      }),
    },
  );

  const breakerPolicy = circuitBreaker(
    handleWhen((err) => {
      if (err instanceof HttpException) {
        const status = err.getStatus();
        return status >= 500 || status === 429;
      }
      return true;
    }),
    {
      halfOpenAfter: finalConfig.circuitBreakerDuration,
      breaker: new ConsecutiveBreaker(finalConfig.circuitBreakerThreshold),
    },
  );

  return wrap(breakerPolicy, retryPolicy);
}
