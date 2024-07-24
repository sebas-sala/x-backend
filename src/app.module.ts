import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { AppService } from './app.service';
import { AppController } from './app.controller';

import { User } from './users/entities/user.entity';
import { Post } from './posts/entities/post.entity';
import { Like } from './likes/entities/like.entity';
import { Image } from './images/entities/image.entity';
import { Follow } from './follow/entities/follow.entity';
import { Comment } from './comments/entities/comment.entity';
import { Profile } from './profiles/entities/profile.entity';
import { Bookmark } from './bookmarks/entities/bookmark.entity';
import { BlockedUser } from './blocked-users/entities/blocked-user.entity';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { LikesModule } from './likes/likes.module';
import { FollowModule } from './follow/follow.module';
import { ImagesModule } from './images/images.module';
import { ProfilesModule } from './profiles/profiles.module';
import { CommentsModule } from './comments/comments.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { BlockedUsersModule } from './blocked-users/blocked-users.module';

import configuration from './config/configuration';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

@Module({
  imports: [
    AuthModule,
    UsersModule,
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
      entities: [
        User,
        Post,
        Like,
        Image,
        Follow,
        Comment,
        Profile,
        Bookmark,
        BlockedUser,
      ],
      synchronize: true,
    }),
    ProfilesModule,
    ImagesModule,
    LikesModule,
    BookmarksModule,
    CommentsModule,
    BlockedUsersModule,
    FollowModule,
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
