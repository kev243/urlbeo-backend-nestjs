import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe, VersioningType } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(helmet());
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
