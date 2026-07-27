import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { ProfileEntity, PublicUser } from '@social/shared';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  search(@Query('q') q: string): Promise<PublicUser[]> {
    return this.usersService.search(q ?? '');
  }

  @Patch('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  updateMe(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<PublicUser> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('me')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  deleteMe(@CurrentUser('id') userId: string): Promise<void> {
    return this.usersService.deleteAccount(userId);
  }

  @Get(':username/profile')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getProfile(
    @CurrentUser('id') viewerId: string,
    @Param('username') username: string,
  ): Promise<ProfileEntity> {
    return this.usersService.getProfile(viewerId, username);
  }

  @Get(':username')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  getByUsername(@Param('username') username: string): Promise<PublicUser> {
    return this.usersService.getPublicByUsername(username);
  }
}
