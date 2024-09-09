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
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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
  );

  const config = new DocumentBuilder()
    .setTitle('X API')
    .setDescription('The X API ')
    .setVersion('1.0')
    .addTag('X')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/swagger', app, document);

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

  await app.listen(8000, '0.0.0.0');
}
bootstrap();
