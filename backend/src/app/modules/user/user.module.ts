import { Module } from '@nestjs/common'
import { UserController } from './user.controller.js'
import { UserService } from './user.service.js'
import { User } from 'src/db/entities/user.entity.js';

@Module({
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
