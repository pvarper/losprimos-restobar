import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { AuthExceptionFilter } from './infrastructure/auth/filters/auth-exception.filter';
import { ApiKeyAuthGuard } from './infrastructure/auth/guards/api-key-auth.guard';
import { InternalSessionGuard } from './infrastructure/auth/guards/internal-session.guard';
import { RbacGuard } from './infrastructure/auth/guards/rbac.guard';

export const configureApp = (app: INestApplication): void => {
  app.useGlobalGuards(
    app.get(ApiKeyAuthGuard),
    app.get(InternalSessionGuard),
    app.get(RbacGuard),
  );
  app.useGlobalFilters(app.get(AuthExceptionFilter));
};

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  configureApp(app);
  await app.listen(3000, '0.0.0.0');
}

void bootstrap();
