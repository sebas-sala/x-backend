import { Injectable } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

interface QueryRunnerFactoryMethods {
  createQueryRunner(): QueryRunner;
}

@Injectable()
export class QueryRunnerFactory implements QueryRunnerFactoryMethods {
  constructor(private dataSource: DataSource) {}

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
