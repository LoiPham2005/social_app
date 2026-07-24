import { Module } from '@nestjs/common';
import { FriendshipsModule } from '../friendships/friendships.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  imports: [FriendshipsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
