import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import axios from 'axios';
import {
  ProtheusUserIdResponse,
  ProtheusUserDetailsResponse,
  UserInfo,
} from '../interfaces/auth.interface';

@Injectable()
export class ProtheusTokenStrategy extends PassportStrategy(
  Strategy,
  'protheus-token',
) {
  private readonly protheusOAuthUrl: string;

  constructor(private configService: ConfigService) {
    super();
    this.protheusOAuthUrl = this.configService.get<string>(
      'PROTHEUS_OAUTH_URL',
    );
  }

  async validate(request: any): Promise<any> {
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Token not provided');
    }

    const token = authHeader.substring(7);

    try {
      // Validate token and get user info from Protheus
      const userInfo = await this.validateTokenWithProtheus(token);

      // Return user info to be attached to request
      return {
        ...userInfo,
        protheusToken: token,
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new UnauthorizedException('Invalid or expired token');
        }
        throw new UnauthorizedException(
          `Protheus authentication failed: ${error.message}`,
        );
      }
      throw new UnauthorizedException('Authentication failed');
    }
  }

  private async validateTokenWithProtheus(token: string): Promise<UserInfo> {
    try {
      // Step 1: Get User ID to validate token
      const userIdResponse = await axios.get<ProtheusUserIdResponse>(
        `${this.protheusOAuthUrl}/rest/users/GetUserId`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      const userId = userIdResponse.data.userID;

      if (!userId) {
        throw new UnauthorizedException('Failed to get user ID from Protheus');
      }

      // Step 2: Get User Details
      const userDetailsResponse = await axios.get<ProtheusUserDetailsResponse>(
        `${this.protheusOAuthUrl}/rest/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      const userDetails = userDetailsResponse.data;

      // Extract email from emails array
      const protheusEmail =
        userDetails.emails?.find((e) => e.primary)?.value ||
        userDetails.emails?.[0]?.value ||
        userDetails.externalId ||
        '';

      if (!protheusEmail) {
        throw new UnauthorizedException(
          'Email not found in Protheus. Please contact the administrator.',
        );
      }

      // Check if user is admin (userId='000000' or group='000000')
      const isAdmin =
        userId === '000000' ||
        userDetails.groups?.some((group) => group.value === '000000') ||
        false;

      // Check if user is active
      const isActive = userDetails.active !== false; // Default to true if not specified

      if (!isActive) {
        throw new UnauthorizedException('User is inactive');
      }

      // Build user info
      const userInfo: UserInfo = {
        id: userDetails.id || userId,
        username: userDetails.userName,
        name: userDetails.displayName || userDetails.name?.formatted || '',
        email: protheusEmail,
        department: userDetails.department,
        isActive,
        isAdmin,
        protheusUserId: userId,
      };

      return userInfo;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new UnauthorizedException('Invalid or expired token');
        }
        throw new UnauthorizedException(
          `Failed to validate token with Protheus: ${error.message}`,
        );
      }
      throw error;
    }
  }
}
