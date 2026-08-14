import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.APP_AUTH_SECRET ?? '',
  expiresIn: '10y', // 10 years in JWT format
}));
