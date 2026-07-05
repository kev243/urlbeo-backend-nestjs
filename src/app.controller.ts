import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
  HealthCheck,
  HealthCheckService,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly prismaHealth: PrismaHealthIndicator,
  ) {}

  @Get()
  getApiPresentation() {
    return this.appService.getApiPresentation();
  }

  @Get('health/json')
  getHealth() {
    return this.appService.getHealth();
  }

  @Get('health')
  getLiveness() {
    return this.appService.getHealth();
  }

  @Get('health/live')
  live() {
    return this.appService.getHealth();
  }

  @Get('health/ready')
  @HealthCheck()
  async readiness() {
    return this.health.check([
      async () =>
        this.prismaHealth.pingCheck('database', this.prisma, { timeout: 1000 }),
    ]);
  }
}
