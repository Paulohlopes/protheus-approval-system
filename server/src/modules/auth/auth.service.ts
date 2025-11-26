import {
  Injectable,
  UnauthorizedException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { LoginDto } from './dto/login.dto';
import {
  ProtheusTokenResponse,
  ProtheusTokenResponseSuccess,
  ProtheusUserIdResponse,
  ProtheusUserDetailsResponse,
  AuthResponse,
  UserInfo,
} from './interfaces/auth.interface';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly protheusOAuthUrl: string;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.protheusOAuthUrl = this.configService.get<string>(
      'PROTHEUS_OAUTH_URL',
    );
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const { username, password } = loginDto;

    try {
      this.logger.log(`Login attempt for user: ${username}`);

      // Step 1: Get OAuth2 token from Protheus
      const tokenResponse = await this.getProtheusToken(username, password);

      // Step 2: Get User ID
      const userId = await this.getProtheusUserId(tokenResponse.access_token);

      // Step 3: Get User Details
      const userDetails = await this.getProtheusUserDetails(
        userId,
        tokenResponse.access_token,
      );

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
      const user: UserInfo = {
        id: userDetails.id || userId,
        username: userDetails.userName,
        name: userDetails.displayName || userDetails.name?.formatted || '',
        email: protheusEmail,
        department: userDetails.department,
        isActive,
        isAdmin,
        protheusUserId: userId,
      };

      // Sync user to PostgreSQL (JIT User Provisioning)
      await this.syncUserToPostgres(user);

      // Build auth response
      const response: AuthResponse = {
        access_token: tokenResponse.access_token,
        refresh_token: tokenResponse.refresh_token,
        expires_in: tokenResponse.expires_in,
        user,
      };

      this.logger.log(`Login successful for user: ${username}`);
      return response;
    } catch (error) {
      this.logger.error(`Login failed for user: ${username}`, error);
      this.handleProtheusError(error, 'Login failed');
    }
  }

  private async getProtheusToken(
    username: string,
    password: string,
  ): Promise<ProtheusTokenResponseSuccess> {
    try {
      const url = `${this.protheusOAuthUrl}/rest/api/oauth2/v1/token`;
      const params = {
        grant_type: 'password',
        username: username,
        password: password,
      };

      const response = await axios.post<ProtheusTokenResponse>(url, null, {
        params,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        timeout: 30000,
      });

      // Check for password change requirement
      if (
        response.status === 202 &&
        typeof response.data === 'string' &&
        (response.data.includes('troca de senha') ||
          response.data.includes('change password'))
      ) {
        throw new UnauthorizedException(
          'Password change required - Please contact the system administrator to reset your password',
        );
      }

      // Ensure response.data is an object with access_token
      if (typeof response.data !== 'object' || response.data === null || !('access_token' in response.data)) {
        throw new UnauthorizedException(
          'Authentication failed - Token not received',
        );
      }

      return response.data as ProtheusTokenResponseSuccess;
    } catch (error) {
      this.handleProtheusError(error, 'Failed to get OAuth2 token');
    }
  }

  private async getProtheusUserId(accessToken: string): Promise<string> {
    try {
      const response = await axios.get<ProtheusUserIdResponse>(
        `${this.protheusOAuthUrl}/rest/users/GetUserId`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      if (!response.data || !response.data.userID) {
        throw new UnauthorizedException('Failed to get user ID');
      }

      return response.data.userID;
    } catch (error) {
      this.handleProtheusError(error, 'Failed to get user ID');
    }
  }

  private async getProtheusUserDetails(
    userId: string,
    accessToken: string,
  ): Promise<ProtheusUserDetailsResponse> {
    try {
      const response = await axios.get<ProtheusUserDetailsResponse>(
        `${this.protheusOAuthUrl}/rest/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      if (!response.data) {
        throw new UnauthorizedException('Failed to get user details');
      }

      return response.data;
    } catch (error) {
      this.handleProtheusError(error, 'Failed to get user details');
    }
  }

  /**
   * Sync user from Protheus to PostgreSQL
   * Creates user if doesn't exist, updates if exists
   */
  private async syncUserToPostgres(user: UserInfo): Promise<void> {
    try {
      await this.prisma.user.upsert({
        where: { email: user.email },
        update: {
          username: user.username,
          name: user.name,
          department: user.department,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
        },
        create: {
          username: user.username,
          name: user.name,
          email: user.email,
          department: user.department,
          isActive: user.isActive,
          isAdmin: user.isAdmin,
        },
      });

      this.logger.log(`User synced to PostgreSQL: ${user.email}`);
    } catch (error) {
      this.logger.error(`Failed to sync user to PostgreSQL: ${user.email}`, error);
      // Don't throw - allow login to continue even if sync fails
    }
  }

  private handleProtheusError(error: any, message: string): never {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        throw new UnauthorizedException('Invalid username or password');
      } else if (error.response?.status === 403) {
        throw new UnauthorizedException('Access denied');
      } else if (error.code === 'ECONNABORTED') {
        throw new InternalServerErrorException(
          'Request timeout - Server did not respond',
        );
      } else if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException(
          'Network error - Unable to connect to Protheus server',
        );
      }
    }

    if (error instanceof UnauthorizedException) {
      throw error;
    }

    throw new InternalServerErrorException(
      `${message}: ${error.message || 'Unknown error'}`,
    );
  }
}
