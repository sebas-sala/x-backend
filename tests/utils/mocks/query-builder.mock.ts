export default class QueryBuilderMock {
  where = jest.fn().mockReturnThis();
  andWhere = jest.fn().mockReturnThis();
  orWhere = jest.fn().mockReturnThis();
  leftJoinAndSelect = jest.fn().mockReturnThis();
  orderBy = jest.fn().mockReturnThis();
  delete = jest.fn().mockReturnThis();
  getOne = jest.fn();
  getMany = jest.fn();
  execute = jest.fn();
}
