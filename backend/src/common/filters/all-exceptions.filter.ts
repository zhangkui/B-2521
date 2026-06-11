import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = '服务器内部错误';
    let code = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      httpStatus = exception.getStatus();
      const response = exception.getResponse();

      if (typeof response === 'object' && response !== null) {
        const res = response as Record<string, any>;
        message = res.message || exception.message;
        code = res.error || res.code || exception.constructor.name;
      } else {
        message = exception.message;
        code = exception.constructor.name;
      }
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      code = `PRISMA_${exception.code}`;

      switch (exception.code) {
        case 'P2002':
          message = '数据唯一约束冲突，可能已存在相同记录';
          httpStatus = HttpStatus.CONFLICT;
          break;
        case 'P2003':
          message = '外键约束失败，请检查关联数据是否存在';
          break;
        case 'P2025':
          message = '操作的记录不存在';
          httpStatus = HttpStatus.NOT_FOUND;
          break;
        default:
          message = exception.message;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      httpStatus = HttpStatus.BAD_REQUEST;
      message = '数据验证失败，请检查输入格式';
      code = 'PRISMA_VALIDATION_ERROR';
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      error: {
        code,
        message,
      },
    };

    console.error(`[${httpStatus}] ${code}: ${message}`, exception instanceof Error ? exception.stack : '');

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
