import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import fastifyCookie from '@fastify/cookie';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { TestAppModule } from './modules/test-app.module';
import { initializeFactories } from './initialize-factories';

export async function setupTestApp(port = 0) {
  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
    {
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
      cors: {
        origin: ['http://localhost:5173', 'http://localhost:3000'],
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

  await app.init();
  await app.listen({ port });
  await app.getHttpAdapter().getInstance().ready();

  const dataSource = moduleRef.get<DataSource>(DataSource);
  const jwtService = moduleRef.get<JwtService>(JwtService);

  const server = app.getHttpServer();
  const currentPort = (server.address() as any).port;

  const factories = await initializeFactories(dataSource);

  async function closeApp() {
    await app.close();
  }

  return {
    app,
    currentPort,
    dataSource,
    jwtService,
    closeApp,
    moduleRef,
    ...factories,
  };
}
