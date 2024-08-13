import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from '@/src/common/filters/http-exception.filter';
import { Test, TestingModule } from '@nestjs/testing';
import { Request, Response } from 'express';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: Partial<Response>;
  let mockRequest: Partial<Request>;

  beforeEach(async () => {
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };
    mockRequest = {
      url: '/test-url',
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);
  });

  it('should be defined', () => {
    expect(filter).toBeDefined();
  });

  it('should handle HttpException with default message', () => {
    const exception = new HttpException(
      'Default error message',
      HttpStatus.BAD_REQUEST,
    );
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      message: 'Default error message',
      path: '/test-url',
    });
  });

  it('should handle HttpException with validation errors', () => {
    const validationErrorResponse = {
      message: ['Validation error message'],
      statusCode: HttpStatus.BAD_REQUEST,
    };
    const exception = new HttpException(
      validationErrorResponse,
      HttpStatus.BAD_REQUEST,
    );
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      message: 'Validation error message',
      path: '/test-url',
    });
  });

  it('should handle HttpException with nested validation errors', () => {
    const validationErrorResponse = {
      message: ['Nested validation error message'],
      statusCode: HttpStatus.BAD_REQUEST,
    };
    const exception = new HttpException(
      validationErrorResponse,
      HttpStatus.BAD_REQUEST,
    );
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      message: 'Nested validation error message',
      path: '/test-url',
    });
  });

  it('should handle HttpException with no validation errors', () => {
    const exception = new HttpException(
      { message: 'Another error message' },
      HttpStatus.BAD_REQUEST,
    );
    const host = {
      switchToHttp: () => ({
        getResponse: () => mockResponse as Response,
        getRequest: () => mockRequest as Request,
      }),
    } as ArgumentsHost;

    filter.catch(exception, host);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.send).toHaveBeenCalledWith({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: expect.any(String),
      message: 'Another error message',
      path: '/test-url',
    });
  });
});
