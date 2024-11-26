import { Module } from '@nestjs/common';
import { BookmarksService } from './bookmarks.service';
import { Bookmark } from './entities/bookmark.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Bookmark])],
  providers: [BookmarksService],
  exports: [BookmarksService],
})
export class BookmarksModule {}
