import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly health: HealthCheckService,
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
  @HealthCheck()
  check() {
    return this.health.check([]);
  }
}
