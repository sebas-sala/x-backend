import { ApiProperty } from '@nestjs/swagger';

export class LoginResponseSchema {
  @ApiProperty({
    example:
      'eyJhbGciareiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ',
  })
  access_token: string;
}
