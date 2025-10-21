import { Module, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { redisStore } from 'cache-manager-redis-store';

@Global()
@Module({
  imports: [
    NestCacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const store = await redisStore({
          socket: {
            host: configService.get<string>('REDIS_HOST') ?? 'localhost',
            port: configService.get<number>('REDIS_PORT') ?? 6379,
          },
          password: configService.get<string>('REDIS_PASSWORD'),
          ttl: configService.get<number>('REDIS_TTL') ?? 180, // 3 minutes default
        });

        return {
          store: store as any,
          isGlobal: true,
        };
      },
    }),
  ],
  exports: [NestCacheModule],
})
export class CacheModule {}
