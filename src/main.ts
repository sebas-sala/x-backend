import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCsrfProtection from '@fastify/csrf-protection';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      logger: true,
      ignoreTrailingSlash: true,
      ignoreDuplicateSlashes: true,
      caseSensitive: false,
      onProtoPoisoning: 'error',
      onConstructorPoisoning: 'error',
      connectionTimeout: 10000,
      bodyLimit: 10485760,
      maxParamLength: 5000,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
    }),
  );

  await app.register(fastifyCookie, {
    secret: process.env.COOKIES_SECRET,
  });

  await app.register(fastifyHelmet);
  await app.register(fastifyCsrfProtection);

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
