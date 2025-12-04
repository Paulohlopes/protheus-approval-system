import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator to extract the country ID from the request header X-Country-Id
 *
 * Usage:
 * @Get()
 * async findAll(@CountryId() countryId: string) {
 *   // countryId will be extracted from X-Country-Id header
 * }
 *
 * @Get()
 * async findAll(@CountryId({ required: false }) countryId?: string) {
 *   // countryId will be optional
 * }
 */
export const CountryId = createParamDecorator(
  (options: { required?: boolean } = { required: true }, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const countryId = request.headers['x-country-id'];

    if (options.required && !countryId) {
      throw new Error('X-Country-Id header is required');
    }

    return countryId;
  },
);

/**
 * Decorator to inject the full country context into the request
 * Must be used with CountryInterceptor
 */
export const CountryContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.countryContext;
  },
);
