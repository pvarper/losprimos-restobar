import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/main';

const TOKEN_HEADERS = ['authorization', 'x-session-id', 'set-cookie'];

describe('Auth contract e2e (API Key-only)', () => {
  let app: NestFastifyApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    configureApp(app);
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterEach(async () => {
    await app.close();
  });

  it('permite endpoint público sin credenciales', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it('rechaza endpoint protegido sin API Key', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('devuelve contexto autenticado sin exponer token, accessToken ni sessionId', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: {
        'x-api-key': 'admin-cajero-key',
      },
    });
    const body = response.json() as Record<string, unknown>;

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      principalId: 'internal-admin-cajero',
      roles: ['admin', 'cajero'],
      authMethod: 'api-key',
    });
    expect(body).not.toHaveProperty('token');
    expect(body).not.toHaveProperty('accessToken');
    expect(body).not.toHaveProperty('sessionId');

    for (const headerName of TOKEN_HEADERS) {
      expect(response.headers[headerName]).toBeUndefined();
    }
  });
});
