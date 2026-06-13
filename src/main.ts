import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';

const corsOrigins = process.env.CORS_ORIGINS?.split(',') ?? [];
if (corsOrigins.length === 0) {
  console.warn(
    'No CORS origins configured. Set CORS_ORIGINS in .env to enable CORS.',
  );
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
