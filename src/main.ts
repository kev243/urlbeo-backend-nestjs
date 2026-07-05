import 'newrelic';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import './instrument';

const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];
if (corsOrigins.length === 0) {
  console.warn(
    'No CORS origins configured. Set CORS_ORIGINS in .env to enable CORS.',
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.setGlobalPrefix('api');
  app.use(helmet());

  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Supprime les propriétés non définies dans les DTOs
      forbidNonWhitelisted: true, // Retourne une erreur si des propriétés non définies sont présentes
      transform: true, // Transforme les payloads en instances de classes DTO
      transformOptions: { enableImplicitConversion: true }, // Permet la conversion implicite des types (ex: string -> number)
    }),
  );
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
  });

  const config = new DocumentBuilder()
    .setTitle('Urlbeo API')
    .setDescription('API for Urlbeo link management application')
    .setVersion('1.0')
    .addTag('urlbeo')
    .build();

  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, documentFactory);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
