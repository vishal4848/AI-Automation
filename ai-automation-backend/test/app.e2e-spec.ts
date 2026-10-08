import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .then((res) => {
        expect(res.text).toContain('AI Automation Platform API');
        expect(res.text).toContain('Status: Healthy & Active');
      });
  });

  it('/privacy (GET)', () => {
    return request(app.getHttpServer())
      .get('/privacy')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .then((res) => {
        expect(res.text).toContain('Privacy Policy');
      });
  });

  it('/deletion (GET)', () => {
    return request(app.getHttpServer())
      .get('/deletion')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .then((res) => {
        expect(res.text).toContain('User Data Deletion Instructions');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
