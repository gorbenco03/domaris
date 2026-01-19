import { extractHeaderToken, genHex, getJti } from '../core/helper';
import {
  BadRequestException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import Redis from 'ioredis';
import { jwtVerify, SignJWT } from 'jose';
import { User } from '../db/entities/user.entity.js';
import { type AuthModuleOptions } from './auth.module.js';
import { LoginDto, RegisterDto, AppleAuthDto } from './dto/auth.dto';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import appleSignin from 'apple-signin-auth';

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    @Inject('AUTH_OPTIONS') private readonly options: AuthModuleOptions,
    @Inject('REDIS_CLIENT') private readonly redisClient: Redis,
  ) { }

  // --- Password Auth ---

  async register(data: RegisterDto) {
    const existingUser = await User.findOne({ where: { email: data.email } });
    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password || '', 10);

    const user = await User.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.userType || 'tenant',
    });

    // Auto-login after register
    return this.login(user);
  }

  async validateUser(email: string, pass: string): Promise<User | null> {
    const user = await User.findOne({ where: { email } });
    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: `${user.firstName} ${user.lastName}`,
    };

    const accessToken = await this.genToken(user.id, payload);
    const refreshToken = genHex(64); // Simple opaque token

    // Store refresh token in Redis (or DB)
    // await this.redisClient.set(`refresh:${refreshToken}`, user.id, 'EX', 30 * 24 * 60 * 60);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // --- OAuth ---

  async googleLogin(idToken: string) {
    try {
      const ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      if (!payload) throw new UnauthorizedException('Invalid Google Token');

      const { email, sub: googleId, given_name, family_name } = payload;

      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Create new user
        user = await User.create({
          email,
          googleId,
          firstName: given_name,
          lastName: family_name,
          role: 'tenant', // Default role for social login
        });
      } else if (!user.googleId) {
        // Link existing account
        user.googleId = googleId;
        await user.save();
      }

      return this.login(user);
    } catch (error) {
      console.error('Google Auth Error:', error);
      throw new UnauthorizedException('Google authentication failed');
    }
  }

  async appleLogin(data: AppleAuthDto) {
    try {
      const { identityToken, fullName } = data;

      // Verify Apple Token
      // NOTE: You might need to configure teamId, keyId, etc. in appleSignin options if using verifyIdToken
      const payload = await appleSignin.verifyIdToken(identityToken, {
        audience: process.env.APPLE_CLIENT_ID,
        ignoreExpiration: true, // Sometimes helpful for testing, set false for prod
      });

      const { email, sub: appleId } = payload;
      let user = await User.findOne({ where: { email } });

      if (!user) {
        // Name is only sent on first login by Apple
        const firstName = fullName ? fullName.split(' ')[0] : 'Apple User';
        const lastName = fullName ? fullName.split(' ').slice(1).join(' ') : '';

        user = await User.create({
          email,
          appleId,
          firstName,
          lastName,
          role: 'tenant',
        });
      } else if (!user.appleId) {
        user.appleId = appleId;
        await user.save();
      }

      return this.login(user);
    } catch (error) {
      console.error('Apple Auth Error:', error);
      throw new UnauthorizedException('Apple authentication failed');
    }
  }

  // --- Token helpers ---

  async genToken(
    user_id: string | number,
    data: any,
    type = this.options.type || 'user',
  ) {
    const token_id = genHex();
    return this.signJwt(data, { type, token_id, sub_id: user_id });
  }

  async verifyJwt(req: any) {
    try {
      const token = extractHeaderToken(req);

      if (!token) throw new UnauthorizedException('No token provided');

      return await jwtVerify(token, Buffer.from(this.options.secret));
    } catch (error) {
      console.error('JWT verification error:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }

  private signJwt(
    data: any,
    opts: {
      type: string;
      token_id: string;
      sub_id: string | number;
      audience?: string;
    },
  ) {
    const signJwt = new SignJWT(data)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setIssuer(opts.type)
      .setSubject(opts.sub_id.toString());

    if (opts.token_id) signJwt.setJti(getJti(opts.token_id));

    if (opts.audience || this.options.audience)
      signJwt.setAudience(opts.audience || this.options.audience);

    if (this.options.expiresIn)
      signJwt.setExpirationTime(`${this.options.expiresIn}s`);

    return signJwt.sign(Buffer.from(this.options.secret));
  }

  async getUser(payloadJwt: any) {
    try {
      const userId = payloadJwt.payload.sub;

      let subscriptionStatus;

      try {
        const redisData = await this.redisClient.get(
          `subscriptionStatus:${userId}`,
        );
        subscriptionStatus = redisData ? JSON.parse(redisData) : null;
      } catch (redisError) {
        console.warn('Redis error, using database values:', redisError);
      }

      return { ...payloadJwt.payload, subscriptionStatus };
    } catch (error) {
      console.error('Error in getUser:', error);
      throw new UnauthorizedException('Invalid user');
    }
  }
}
