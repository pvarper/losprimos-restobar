import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { describe, beforeEach, afterEach, expect, it } from 'vitest';
import { AppModule } from '../../../src/app.module';
import { configureApp } from '../../../src/main';

describe('IdentityAccess module integration (global wiring)', () => {
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

  it('responde 401 cuando falta API Key (matriz authn)', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/identity-access/protected/admin-cajero',
      headers: {
        'x-session-id': 'session-vigente',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('responde 403 cuando API Key es válida pero no tiene roles requeridos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/identity-access/protected/admin-cajero',
      headers: {
        'x-api-key': 'admin-only-key',
        'x-session-id': 'session-vigente',
      },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json()).toMatchObject({
      code: 'AUTH_FORBIDDEN',
    });
  });

  it('responde 200 con API Key válida + sesión vigente + roles requeridos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/identity-access/protected/admin-cajero',
      headers: {
        'x-api-key': 'admin-cajero-key',
        'x-session-id': 'session-vigente',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
    });
  });

  it('responde 401 cuando la sesión interna está expirada', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/identity-access/protected/admin-cajero',
      headers: {
        'x-api-key': 'admin-cajero-key',
        'x-session-id': 'session-expirada',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'AUTH_UNAUTHENTICATED',
    });
  });

  it('responde 401 cuando la sesión interna está revocada', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/identity-access/protected/admin-cajero',
      headers: {
        'x-api-key': 'admin-cajero-key',
        'x-session-id': 'session-revocada',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      code: 'AUTH_UNAUTHENTICATED',
    });
  });
});
