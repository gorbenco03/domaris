import { Injectable, NotFoundException } from '@nestjs/common';
import { User } from '../../db/entities/user.entity.js';
import { CompleteProfileDto } from './user.dto.js';

@Injectable()
export class UserService {
  // --- Profile Methods ---

  async getProfile(userId: number) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ['password', 'googleId', 'appleId'] },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(userId: number, dto: CompleteProfileDto) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    // Update fields
    if (dto.fullName) {
      const parts = dto.fullName.split(' ');
      user.firstName = parts[0];
      user.lastName = parts.slice(1).join(' ');
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;

    // Map other fields from CompleteProfileDto if needed
    // For now we focused on basic profile updates 

    await user.save();
    return this.getProfile(userId);
  }

  async updateAvatar(userId: number, avatarUrl: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');

    user.avatar = avatarUrl;
    await user.save();
    return { avatar: avatarUrl };
  }

  async getPublicProfile(id: string | number) {
    const user = await User.findByPk(id, {
      attributes: ['id', 'firstName', 'lastName', 'avatar', 'verificationLevel', 'rating', 'createdAt'],
    });
    if (!user) throw new NotFoundException('User not found');

    return user;
  }

  async deleteUser(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundException('User not found');
    await user.destroy();
    return { message: 'User deleted' };
  }
}
