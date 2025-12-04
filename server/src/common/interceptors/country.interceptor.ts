import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { CountryService } from '../../modules/country/country.service';

export interface CountryContextData {
  id: string;
  code: string;
  name: string;
  tableSuffix: string;
  isActive: boolean;
}

/**
 * Interceptor that validates the X-Country-Id header and attaches
 * country context to the request.
 *
 * Usage:
 * @UseInterceptors(CountryInterceptor)
 * @Controller('my-controller')
 * export class MyController { ... }
 */
@Injectable()
export class CountryInterceptor implements NestInterceptor {
  constructor(private readonly countryService: CountryService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const countryId = request.headers['x-country-id'];

    if (countryId) {
      try {
        const country = await this.countryService.findOne(countryId);

        if (!country.isActive) {
          throw new BadRequestException(`Country ${country.code} is not active`);
        }

        // Attach country context to request
        request.countryContext = {
          id: country.id,
          code: country.code,
          name: country.name,
          tableSuffix: country.tableSuffix,
          isActive: country.isActive,
        } as CountryContextData;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Invalid country ID: ${countryId}`);
      }
    }

    return next.handle();
  }
}

/**
 * Interceptor that requires a valid country ID in the request.
 * Use this for endpoints that must have a country context.
 */
@Injectable()
export class RequireCountryInterceptor implements NestInterceptor {
  constructor(private readonly countryService: CountryService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const countryId = request.headers['x-country-id'];

    if (!countryId) {
      // Try to get default country
      const defaultCountry = await this.countryService.getDefault();
      if (!defaultCountry) {
        throw new BadRequestException(
          'X-Country-Id header is required and no default country is configured',
        );
      }

      request.countryContext = {
        id: defaultCountry.id,
        code: defaultCountry.code,
        name: defaultCountry.name,
        tableSuffix: defaultCountry.tableSuffix,
        isActive: defaultCountry.isActive,
      } as CountryContextData;
    } else {
      try {
        const country = await this.countryService.findOne(countryId);

        if (!country.isActive) {
          throw new BadRequestException(`Country ${country.code} is not active`);
        }

        request.countryContext = {
          id: country.id,
          code: country.code,
          name: country.name,
          tableSuffix: country.tableSuffix,
          isActive: country.isActive,
        } as CountryContextData;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }
        throw new BadRequestException(`Invalid country ID: ${countryId}`);
      }
    }

    return next.handle();
  }
}
