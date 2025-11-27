import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Get config service
  const configService = app.get(ConfigService);

  // SEC-03: Security headers with Helmet
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"], // Required for MUI
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          connectSrc: ["'self'", configService.get('CORS_ORIGIN') || 'http://localhost:5173'],
          fontSrc: ["'self'", 'https:', 'data:'],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          frameSrc: ["'none'"],
        },
      },
      crossOriginEmbedderPolicy: false, // Required for CORS with credentials
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // CORS
  app.enableCors({
    origin: configService.get('CORS_ORIGIN') || 'http://localhost:5173',
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('api');

  // MAN-05: Swagger/OpenAPI documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Protheus Approval System API')
    .setDescription(`
## Sistema de Aprovação de Cadastros Protheus

Esta API gerencia o fluxo de aprovação de cadastros para integração com o ERP Protheus.

### Funcionalidades principais:
- **Autenticação**: Login via credenciais Protheus
- **Registros**: Criação, edição e submissão de cadastros
- **Workflows**: Configuração de fluxos de aprovação multinível
- **Grupos de Aprovação**: Gerenciamento de grupos e membros
- **Integrações**: Sincronização automática com Protheus

### Autenticação
Todos os endpoints (exceto /health e /auth/login) requerem autenticação via JWT Bearer token.

### Rate Limiting
- 10 requests/segundo (burst)
- 50 requests/10 segundos
- 100 requests/minuto
    `)
    .setVersion('1.0.0')
    .setContact('Suporte', '', 'suporte@empresa.com.br')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Token JWT obtido via /api/auth/login',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Autenticação e gerenciamento de sessão')
    .addTag('registrations', 'Solicitações de cadastro')
    .addTag('approval-groups', 'Grupos de aprovadores')
    .addTag('settings', 'Configurações do sistema (admin)')
    .addTag('health', 'Health checks e monitoramento')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Protheus Approval API Docs',
  });

  const port = configService.get('PORT') || 3000;
  await app.listen(port);

  console.log(`\n Backend running on: http://localhost:${port}/api`);
  console.log(` Swagger docs: http://localhost:${port}/api/docs`);
  console.log(` Environment: ${configService.get('NODE_ENV')}`);
  console.log(` Security: Helmet.js enabled`);
}

bootstrap();
