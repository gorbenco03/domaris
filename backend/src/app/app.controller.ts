import { Controller, Get } from '@nestjs/common';

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
}
