import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { OAuth2Client } from 'google-auth-library';
import Redis from 'ioredis';
import * as appleSignin from 'apple-signin-auth';

import { AuthService } from '../../auth/auth.service';
import { User } from '../../db/entities/user.entity';
import { UserOnboarding } from '../../db/entities/userOnboarding.entity';
import { CompleteProfileDto } from './user.dto';

@Injectable()
export class UserService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private authService: AuthService,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) {}

  // ============================================================
  // 🔐 GOOGLE LOGIN
  // ============================================================
  async loginWithGoogle(idToken: string) {
  let ticket;

  try {
    ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
  } catch (error) {
    throw new UnauthorizedException('Invalid Google ID token');
  }

  const payload = ticket.getPayload();

  if (!payload || !payload.email) {
    throw new UnauthorizedException('Google token has no email');
  }

  const email = payload.email.toLowerCase().trim();

  // Find user (including soft-deleted)
  let user = await User.findOne({
    where: { email },
    paranoid: false,
  });

  // Restore soft-deleted user
  if (user && user.deletedAt) {
    await user.restore();
    await user.update({
      hasActiveSubscription: false,
      subscriptionExpiresAt: null,
    });
  }

  // Reset subscription (DEV MODE)
  if (user && !user.deletedAt && user.hasActiveSubscription !== false) {
    await user.update({
      hasActiveSubscription: false,
      subscriptionExpiresAt: null,
    });
  }

  // Create new user if not found
  if (!user) {
    try {
      user = await User.create({
        email,
        hasActiveSubscription: false,
        subscriptionExpiresAt: null,
      });
    } catch (err: any) {
      if (err.name === 'SequelizeUniqueConstraintError') {
        user = await User.findOne({ where: { email }, paranoid: false });
        if (user?.deletedAt) {
          await user.restore();
          await user.update({
            hasActiveSubscription: false,
            subscriptionExpiresAt: null,
          });
        }
      } else {
        throw err;
      }
    }
  }

  // 👇 AICI e fix-ul important
  if (!user) {
    // dacă tot e null aici, ceva e grav în neregulă
    throw new UnauthorizedException('Unable to create or restore user');
  }

  await user.reload();

  // Sync subscription to Redis
  await this.redisClient.set(
    `subscriptionStatus:${user.id}`,
    JSON.stringify({ hasActiveSubscription: user.hasActiveSubscription }),
  );

  // Load user + onboarding
  const userWithOnboarding = await this.getUserWithOnboarding(user.id);

  const token = await this.authService.genToken(user.id, {});
  return { token, user: userWithOnboarding };
}


  // ============================================================
  // 🔐 APPLE LOGIN
  // ============================================================
  async loginWithApple(idToken: string) {
    let payload;

    try {
      payload = await appleSignin.verifyIdToken(idToken, {
        audience: ['host.exp.Exponent', process.env.APPLE_CLIENT_ID],
        ignoreExpiration: false,
      });
    } catch {
      throw new UnauthorizedException('Invalid Apple ID token');
    }

    const { email, sub: appleSub } = payload;

    let user = await User.findOne({
      where: { appleId: appleSub },
      include: [{ model: UserOnboarding, as: 'onboarding' }],
    });

    if (!user && email) {
      user = await User.findOne({
        where: { email },
        include: [{ model: UserOnboarding, as: 'onboarding' }],
      });
    }

    if (!user) {
      user = await User.create({
        email,
        appleId: appleSub,
        fullName: payload.name || null,
      });
    } else if (!user.appleId) {
      user.appleId = appleSub;
      await user.save();
    }

    const token = await this.authService.genToken(user.id, {});
    return { token, user };
  }

  // ============================================================
  // 👤 RETURN AUTHENTICATED USER (+ onboarding)
  // ============================================================
  async me(req: any) {
    if (!req.user?.sub) {
      return { message: 'No authenticated user', user: null, onboarding: null };
    }

    const user = await this.getUserWithOnboarding(req.user.sub);

    if (!user) {
      throw new UnauthorizedException('User account not found.');
    }

    return user;
  }

  // ============================================================
  // 🟦 HELPER — FETCH USER + ONBOARDING
  // ============================================================
  private async getUserWithOnboarding(userId: number) {
    return User.findOne({
      attributes: [
        'id',
        'email',
        'hasActiveSubscription',
        'subscriptionExpiresAt',
      ],
      where: { id: userId },
      include: [
        {
          model: UserOnboarding,
          as: 'onboarding',
          required: false,
        },
      ],
    });
  }

  // ============================================================
  // 📝 COMPLETE ONBOARDING (for owners who want to post listings)
  // ============================================================
  async updateCompleteProfile(req: any, data: CompleteProfileDto) {
    try {
      const [onboarding, created] = await UserOnboarding.findOrCreate({
        where: { userId: req.user.sub },
        defaults: {
  userId: req.user.sub,
  fullName: data.fullName,
  phoneNumber: data.phoneNumber,
  phoneVerified: false,

  ownerType: data.ownerType,
  companyName: data.companyName ?? null,

  petFriendlyDefault: data.petFriendlyDefault ?? null,
  longTermOnlyDefault: data.longTermOnlyDefault ?? null,
  genderPreferenceDefault: data.genderPreferenceDefault ?? null,

  allowedContacts: data.allowedContacts ?? [],

  iban: data.iban ?? null,
  billingAddress: data.billingAddress ?? null,

  isComplete: true,
}
      });

      if (!created) {
        await onboarding.update({
          ...data,
          isComplete: true,
        });
      }

      return 1;
    } catch (error) {
      console.error(error);
      return 0;
    }
  }

  // ============================================================
  // ❌ DELETE USER
  // ============================================================
  async deleteUser(userId: number) {
    try {
      await UserOnboarding.destroy({ where: { userId } });

      const deleted = await User.destroy({ where: { id: userId } });

      await this.redisClient.del(`subscriptionStatus:${userId}`);

      if (deleted === 0) throw new Error('User not found');

      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      throw error;
    }
  }
}
