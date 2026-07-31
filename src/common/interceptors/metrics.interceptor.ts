import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Histogram } from 'prom-client';
import { Request, Response } from 'express';

type RequestWithRoute = Request & {
  route?: {
    path?: string;
  };
};

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestsCounter: Counter<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly requestDuration: Histogram<string>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithRoute>();
    const method = req.method;
    const route = req.route as { path?: unknown } | undefined;
    const routePath = route?.path;
    const path = typeof routePath === 'string' ? routePath : req.path;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const status = String(res.statusCode);
        const duration = (Date.now() - startTime) / 1000;

        const labels = { method, path, status };
        this.requestsCounter.inc(labels);
        this.requestDuration.observe(labels, duration);
      }),
    );
  }
}
