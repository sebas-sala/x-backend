import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FollowsModule } from './follows/follows.module';
import { ProfilesModule } from './profiles/profiles.module';

import { PostsModule } from './posts/posts.module';
import { LikesModule } from './likes/likes.module';
import { ChatsModule } from './chats/chats.module';
import { MessagesModule } from './messages/messages.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BlockedUsersModule } from './blocked-users/blocked-users.module';
import { NotificationsModule } from './notifications/notifications.module';

import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ViewsModule } from './views/views.module';

import configuration from './config/configuration';

@Module({
  imports: [
    ScheduleModule.forRoot(),
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
      database: 'database.sqlite',
      synchronize: true,
      autoLoadEntities: true,
    }),
    AuthModule,
    PostsModule,
    UsersModule,
    LikesModule,
    FollowsModule,
    ProfilesModule,
    MessagesModule,
    BlockedUsersModule,
    NotificationsModule,
    ChatsModule,
    BookmarksModule,
    ViewsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
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
export class AppModule {}
