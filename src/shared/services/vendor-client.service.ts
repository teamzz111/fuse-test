import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { IPolicy } from 'cockatiel';
import { createResiliencePolicy } from '../utils/resilience.util';

interface VendorErrorResponse {
  message?: string;
}

@Injectable()
export class VendorClientService {
  private readonly logger = new Logger(VendorClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly resiliencePolicy: IPolicy;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('MARKET_API_URL') ?? '';
    this.apiKey = this.configService.get<string>('MARKET_API_KEY') ?? '';

    // Initialize resilience policy with configuration from env
    this.resiliencePolicy = createResiliencePolicy({
      retries: this.configService.get<number>('VENDOR_RETRY_ATTEMPTS') ?? 3,
      backoffInitialDelay:
        this.configService.get<number>('VENDOR_RETRY_INITIAL_DELAY') ?? 100,
      backoffMaxDelay:
        this.configService.get<number>('VENDOR_RETRY_MAX_DELAY') ?? 5000,
      circuitBreakerThreshold:
        this.configService.get<number>('VENDOR_CIRCUIT_BREAKER_THRESHOLD') ?? 5,
      circuitBreakerDuration:
        this.configService.get<number>('VENDOR_CIRCUIT_BREAKER_DURATION') ??
        30000,
    });
  }

  async get<T>(
    endpoint: string,
    params?: Record<string, string | number>,
  ): Promise<T> {
    return this.resiliencePolicy.execute(() =>
      this.request<T>({
        method: 'GET',
        url: `${this.baseUrl}${endpoint}`,
        params,
      }),
    );
  }

  async post<T>(
    endpoint: string,
    data?: Record<string, unknown>,
    params?: Record<string, string | number>,
  ): Promise<T> {
    return this.resiliencePolicy.execute(() =>
      this.request<T>({
        method: 'POST',
        url: `${this.baseUrl}${endpoint}`,
        data,
        params,
      }),
    );
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response = await axios.request<T>({
        ...config,
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          ...config.headers,
        },
      });

      return response.data;
    } catch (error) {
      if (error instanceof AxiosError) {
        const errorData = error.response?.data as VendorErrorResponse;
        const errorMessage =
          typeof errorData === 'object' && errorData?.message
            ? errorData.message
            : 'Vendor API request failed';

        this.logger.error(
          `Vendor API error: ${config.method ?? 'UNKNOWN'} ${config.url ?? 'UNKNOWN'} - ${error.response?.status ?? 'N/A'} ${error.response?.statusText ?? 'N/A'}`,
          errorData,
        );

        throw new HttpException(
          errorMessage,
          error.response?.status || HttpStatus.BAD_GATEWAY,
        );
      }

      this.logger.error('Unexpected error calling vendor API', error);
      throw new HttpException(
        'Internal error while calling vendor API',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
