import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type {
  CommentEntity,
  Paginated,
  PostEntity,
} from '@social/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { ReactDto } from './dto/react.dto';
import { PostsService } from './posts.service';

@ApiTags('posts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePostDto,
  ): Promise<PostEntity> {
    return this.postsService.createPost(userId, dto);
  }

  @Get('feed')
  feed(
    @CurrentUser('id') userId: string,
    @Query('cursor') cursor?: string,
  ): Promise<Paginated<PostEntity>> {
    return this.postsService.getFeed(userId, cursor);
  }

  @Get('search')
  search(
    @CurrentUser('id') userId: string,
    @Query('q') q: string,
  ): Promise<PostEntity[]> {
    return this.postsService.searchPosts(userId, q ?? '');
  }

  @Get('user/:userId')
  userPosts(
    @CurrentUser('id') viewerId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Query('cursor') cursor?: string,
  ): Promise<Paginated<PostEntity>> {
    return this.postsService.getUserPosts(viewerId, userId, cursor);
  }

  @Get(':id')
  getOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostEntity> {
    return this.postsService.getPost(userId, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    return this.postsService.deletePost(userId, id);
  }

  @Put(':id/reaction')
  react(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReactDto,
  ): Promise<PostEntity> {
    return this.postsService.react(userId, id, dto.type);
  }

  @Delete(':id/reaction')
  unreact(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostEntity> {
    return this.postsService.unreact(userId, id);
  }

  @Post(':id/comments')
  addComment(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateCommentDto,
  ): Promise<CommentEntity> {
    return this.commentsService.addComment(userId, id, dto);
  }

  @Get(':id/comments')
  listComments(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<CommentEntity[]> {
    return this.commentsService.listByPost(id);
  }
}
