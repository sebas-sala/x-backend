import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { ValidationPipe } from '@nestjs/common';
import { FastifyAdapter } from '@nestjs/platform-fastify';
import { NestFastifyApplication } from '@nestjs/platform-fastify';

import { TestAppModule } from './modules/test-app.module';
import { initializeFactories } from './initialize-factories';

export async function setupTestApp(port = 3000) {
  const moduleRef = await Test.createTestingModule({
    imports: [TestAppModule],
  }).compile();

  const app = moduleRef.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );
  app.useGlobalPipes(new ValidationPipe());

  await app.init();
  await app.listen(port);
  await app.getHttpAdapter().getInstance().ready();

  const dataSource = moduleRef.get<DataSource>(DataSource);
  const jwtService = moduleRef.get<JwtService>(JwtService);

  // const authFactory = new AuthFactory(dataSource);
  const factories = await initializeFactories(dataSource);

  async function closeApp() {
    await app.close();
  }

  return {
    app,
    dataSource,
    jwtService,
    closeApp,
    ...factories,
  };
}