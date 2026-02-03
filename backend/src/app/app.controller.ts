import { Controller, Get, Query } from '@nestjs/common';

@Controller()
export class AppController {
  @Get('health')
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      redis: {
        host: process.env.REDIS_HOST ? '✅ Set' : '❌ Missing',
        port: process.env.REDIS_PORT ? '✅ Set' : '❌ Missing',
        password: process.env.REDIS_PASSWORD ? '✅ Set' : '❌ Missing',
      },
      database: {
        host: process.env.DB_HOST ? '✅ Set' : '❌ Missing',
        user: process.env.DB_USER ? '✅ Set' : '❌ Missing',
        name: process.env.DB_NAME ? '✅ Set' : '❌ Missing',
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ Missing',
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
