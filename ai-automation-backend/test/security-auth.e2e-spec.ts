import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { ResponseInterceptor } from '../src/common/interceptors/response.interceptor';
import { JwtAuthGuard } from '../src/common/guards/jwt-auth.guard';
import { Reflector } from '@nestjs/core';

describe('Security & Authentication (e2e)', () => {
  jest.setTimeout(30000);
  let app: INestApplication;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    const reflector = app.get(Reflector);
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new ResponseInterceptor());
    app.useGlobalGuards(new JwtAuthGuard(reflector));

    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('JWT Guard Rejection Tests (No Auth Bypass)', () => {
    it('should return 401 Unauthorized when NO Authorization header is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/images')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
      expect(res.body.message).toContain('Authentication required');
    });

    it('should return 401 Unauthorized when an INVALID token is provided', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/images')
        .set('Authorization', 'Bearer invalid_forged_jwt_token_12345')
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });

    it('should return 401 Unauthorized when an EXPIRED token is provided', async () => {
      const secret = configService.get<string>('jwt.secret') || 'dev-secret-change-in-production-must-be-32-chars-long';
      const expiredToken = await jwtService.signAsync(
        { sub: 'test-user-id', email: 'test@example.com' },
        { secret, expiresIn: '-10s' }
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/images')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);

      expect(res.body.success).toBe(false);
      expect(res.body.statusCode).toBe(401);
    });

    it('should allow access to @Public() routes like /api/v1/auth/login without token', async () => {
      // Calling with invalid body should return 400 Validation Error, NOT 401 Unauthorized
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({})
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });

    it('should allow access to @Public() routes like /api/v1/auth/register without token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);

      expect(res.body.statusCode).toBe(400);
    });
  });
});
