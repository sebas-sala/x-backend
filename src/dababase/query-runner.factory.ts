import { DataSource, QueryRunner } from 'typeorm';

interface QueryRunnerFactoryMethods {
  createQueryRunner(): QueryRunner;
}

export class QueryRunnerFactory implements QueryRunnerFactoryMethods {
  constructor(private readonly dataSource: DataSource) {}

  createQueryRunner(): QueryRunner {
    return this.dataSource.createQueryRunner();
  }
}
