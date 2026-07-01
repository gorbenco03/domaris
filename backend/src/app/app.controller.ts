import { Controller, Get, Query, Inject, Logger } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';
import { InjectConnection } from '@nestjs/sequelize';
import { Public } from './core/decorators';

@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(
    @InjectConnection() private readonly sequelize: Sequelize,
    @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {}

  @Public()
  @Get('health')
  async getHealth() {
    let dbOk = false;
    let redisOk = false;
    let dbError: string | null = null;
    let redisError: string | null = null;

    // Real DB ping
    try {
      await this.sequelize.authenticate();
      dbOk = true;
    } catch (err: any) {
      dbError = err?.message ?? 'unknown';
      this.logger.error('[Health] DB ping failed', err?.message);
    }

    // Real Redis ping
    try {
      if (typeof this.redisClient.ping === 'function') {
        await this.redisClient.ping();
      } else {
        // In-memory fallback: set + get as liveness check
        await this.redisClient.set('_health_check', '1');
        const val = await this.redisClient.get('_health_check');
        if (val !== '1') throw new Error('In-memory fallback inconsistency');
      }
      redisOk = true;
    } catch (err: any) {
      redisError = err?.message ?? 'unknown';
      this.logger.error('[Health] Redis ping failed', err?.message);
    }

    const allOk = dbOk && redisOk;

    return {
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      checks: {
        database: dbOk ? 'ok' : `error: ${dbError}`,
        redis: redisOk ? 'ok' : `error: ${redisError}`,
      },
    };
  }

  private parseBool(value: string | undefined, defaultValue = false): boolean {
    if (value === undefined) return defaultValue;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  private compareVersions(a: string, b: string): number {
    const parse = (v: string) => v.split('.').map((p) => Number(p) || 0);
    const aa = parse(a);
    const bb = parse(b);
    const len = Math.max(aa.length, bb.length);
    for (let i = 0; i < len; i++) {
      const diff = (aa[i] ?? 0) - (bb[i] ?? 0);
      if (diff !== 0) return diff > 0 ? 1 : -1;
    }
    return 0;
  }

  /**
   * Public endpoint used by mobile clients to decide:
   * - maintenance mode
   * - forced update (min supported version)
   * - optional update (latest version)
   */
  @Get('app/status')
  getAppStatus(
    @Query('platform') platform?: 'ios' | 'android',
    @Query('version') version?: string
  ) {
    const normalizedPlatform = (platform || '').toLowerCase() as 'ios' | 'android';
    const maintenanceEnabled = this.parseBool(process.env.APP_MAINTENANCE);
    const maintenanceMessage = process.env.APP_MAINTENANCE_MESSAGE || 'Aplicația este în mentenanță. Revino în curând.';

    const latestIos = process.env.APP_LATEST_VERSION_IOS || undefined;
    const latestAndroid = process.env.APP_LATEST_VERSION_ANDROID || undefined;
    const minIos = process.env.APP_MIN_VERSION_IOS || undefined;
    const minAndroid = process.env.APP_MIN_VERSION_ANDROID || undefined;

    const latestVersion =
      normalizedPlatform === 'ios'
        ? latestIos
        : normalizedPlatform === 'android'
          ? latestAndroid
          : undefined;

    const minSupportedVersion =
      normalizedPlatform === 'ios'
        ? minIos
        : normalizedPlatform === 'android'
          ? minAndroid
          : undefined;

    const updateRequired =
      !!version &&
      !!minSupportedVersion &&
      this.compareVersions(version, minSupportedVersion) < 0;

    const updateAvailable =
      !!version &&
      !!latestVersion &&
      this.compareVersions(version, latestVersion) < 0;

    return {
      timestamp: new Date().toISOString(),
      maintenance: {
        enabled: maintenanceEnabled,
        message: maintenanceMessage,
      },
      version: {
        platform: normalizedPlatform || null,
        current: version || null,
        minSupported: minSupportedVersion || null,
        latest: latestVersion || null,
        updateRequired,
        updateAvailable,
        iosStoreUrl: process.env.APP_STORE_URL_IOS || null,
        androidStoreUrl: process.env.APP_STORE_URL_ANDROID || null,
      },
    };
  }

  @Get('app/version')
  getAppVersionAlias(@Query('platform') platform?: 'ios' | 'android', @Query('version') version?: string) {
    return this.getAppStatus(platform, version).version;
  }

  @Get('app/maintenance')
  getAppMaintenanceAlias() {
    return this.getAppStatus(undefined, undefined).maintenance;
  }
}
