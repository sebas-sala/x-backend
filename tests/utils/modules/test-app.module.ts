import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { AuthModule } from '@/src/auth/auth.module';
import { PostsModule } from '@/src/posts/posts.module';
import { UsersModule } from '@/src/users/users.module';
import { LikesModule } from '@/src/likes/likes.module';
import { ChatsModule } from '@/src/chats/chats.module';
import { FollowsModule } from '@/src/follows/follows.module';
import { MessagesModule } from '@/src/messages/messages.module';
import { CommentsModule } from '@/src/comments/comments.module';
import { ProfilesModule } from '@/src/profiles/profiles.module';
import { BlockedUsersModule } from '@/src/blocked-users/blocked-users.module';
import { NotificationsModule } from '@/src/notifications/notifications.module';

import configuration from '@/src/config/configuration';

import { HttpExceptionFilter } from '@/src/common/filters/http-exception.filter';

@Module({
  imports: [
    AuthModule,
    PostsModule,
    UsersModule,
    LikesModule,
    ChatsModule,
    FollowsModule,
    ProfilesModule,
    CommentsModule,
    MessagesModule,
    BlockedUsersModule,
    NotificationsModule,
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: seconds(60),
        limit: 100,
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: ':memory:',
      autoLoadEntities: true,
      synchronize: true,
    }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerModule,
    },
  ],
})
export class TestAppModule {}
