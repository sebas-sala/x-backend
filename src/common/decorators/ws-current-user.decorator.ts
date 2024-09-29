import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const WsCurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToWs().getData();
    return request.user;
  },
);
