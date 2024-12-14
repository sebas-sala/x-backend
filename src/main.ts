import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, VersioningType } from '@nestjs/common';
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
      connectionTimeout: 10_000,
      bodyLimit: 10_485_760,
      maxParamLength: 5000,
    }),
    {
      cors: {
        origin: [
          'http://localhost:5173',
          'https://x-frontend-orcin.vercel.app',
          'https://x-frontend-sebastianssalas-projects.vercel.app/',
        ],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        preflightContinue: false,
        optionsSuccessStatus: 204,
        credentials: true,
        maxAge: 86_400,
        exposedHeaders: ['Set-Cookie'],
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  await app.register(fastifyCookie, {
    secret: process.env.COOKIES_SECRET,
  });

  app.register(fastifyHelmet, {
    contentSecurityPolicy: false,
  });

  await app.register(fastifyCsrfProtection);

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  await app.listen({
    port: Number(process.env.PORT) || 3000,
    host: process.env.HOST || '0.0.0.0',
  });
}
bootstrap();
