import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { LinksModule } from './links/links.module';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { StorageModule } from './storage/storage.module';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        // Correlation ID: reprend x-request-id si présent, sinon génère un id
        genReqId: (req, res) => {
          const incoming = req.headers['x-request-id'];
          const id =
            typeof incoming === 'string' && incoming.length > 0
              ? incoming
              : crypto.randomUUID();
          res.setHeader('x-request-id', id);
          return id;
        },

        // Logs HTTP automatiques
        autoLogging: true,

        // Masquage des champs sensibles
        redact: {
          paths: [
            'req.headers.authorization',
            'req.headers.cookie',
            'req.body.password',
            'req.body.token',
            'req.body.accessToken',
            'req.body.refreshToken',
          ],
          remove: true,
        },

        // Sortie lisible en local, JSON en prod
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  singleLine: true,
                  translateTime: 'SYS:standard',
                },
              }
            : undefined,

        customProps: (req) => ({
          requestId: req.id,
        }),
      },
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 60,
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true, // permet d’utiliser process.env partout
    }),
    TerminusModule,
    PrismaModule,
    UsersModule,
    LinksModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
