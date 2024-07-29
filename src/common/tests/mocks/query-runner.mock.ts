import { EntityManager, QueryRunner } from 'typeorm';

export const createMockQueryRunner = (): Partial<QueryRunner> => {
  const manager: Partial<EntityManager> = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  return {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: manager as EntityManager,
  } as Partial<QueryRunner>;
};
