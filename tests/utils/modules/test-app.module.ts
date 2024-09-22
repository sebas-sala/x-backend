import { HttpException, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, seconds } from '@nestjs/throttler';

import { User } from '@/src/users/entities/user.entity';
import { Post } from '@/src/posts/entities/post.entity';
import { Like } from '@/src/likes/entities/like.entity';
import { Follow } from '@/src/follows/entities/follow.entity';
import { Profile } from '@/src/profiles/entities/profile.entity';
import { Message } from '@/src/messages/entities/message.entity';
import { Comment } from '@/src/comments/entities/comment.entity';
import { BlockedUser } from '@/src/blocked-users/entities/blocked-user.entity';

import configuration from '@/src/config/configuration';

import { AuthService } from '@/src/auth/auth.service';
import { AuthModule } from '@/src/auth/auth.module';
import { PostsModule } from '@/src/posts/posts.module';
import { UsersModule } from '@/src/users/users.module';
import { FollowsModule } from '@/src/follows/follows.module';
import { ProfilesModule } from '@/src/profiles/profiles.module';
import { BlockedUsersModule } from '@/src/blocked-users/blocked-users.module';
import { CommentsModule } from '@/src/comments/comments.module';
import { LikesModule } from '@/src/likes/likes.module';
import { MessagesModule } from '@/src/messages/messages.module';
import { HttpExceptionFilter } from '@/src/common/filters/http-exception.filter';

@Module({
  imports: [
    AuthModule,
    PostsModule,
    UsersModule,
    LikesModule,
    FollowsModule,
    ProfilesModule,
    CommentsModule,
    MessagesModule,
    BlockedUsersModule,
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
    TypeOrmModule.forFeature([
      User,
      Post,
      Like,
      Follow,
      Message,
      Profile,
      Comment,
      BlockedUser,
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { expiresIn: '60m' },
    }),
  ],
  providers: [
    AuthService,
    JwtService,
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
