import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';

const LOGIN_WINDOW_MS = 15 * 60_000;
const LOGIN_MAX_ATTEMPTS = 10;
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

function securityHeaders(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()',
  );
  if ((process.env.NODE_ENV ?? 'development') === 'production') {
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload',
    );
  }
  // La API solo sirve JSON: una CSP restrictiva evita cargas activas si un
  // navegador renderiza una respuesta. Se omite en /api/docs (Swagger UI).
  if (!req.path.startsWith('/api/docs')) {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'",
    );
  }
  next();
}

function loginRateLimit(req: Request, res: Response, next: NextFunction) {
  if (req.method !== 'POST' || req.path !== '/api/auth/login') return next();
  const now = Date.now();
  if (loginAttempts.size > 1000) {
    for (const [key, entry] of loginAttempts) {
      if (now > entry.resetAt) loginAttempts.delete(key);
    }
  }
  const key = req.ip ?? 'unknown';
  const entry = loginAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    loginAttempts.set(key, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return next();
  }
  if (entry.count >= LOGIN_MAX_ATTEMPTS) {
    res.status(429).json({
      statusCode: 429,
      message: 'Demasiados intentos de login. Intenta de nuevo en 15 minutos.',
    });
    return;
  }
  entry.count += 1;
  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    // Excluimos 'log' para omitir el mapeo de rutas al arrancar
    logger: ['error', 'warn'], 
  });
  app.setGlobalPrefix('api');
  app.use(securityHeaders);
  app.use(loginRateLimit);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (
    process.env.CORS_ORIGIN ??
    'http://localhost:4200,http://localhost:5173,http://localhost:8080'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({
    origin: corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  });

  const isProduction = (process.env.NODE_ENV ?? 'development') === 'production';
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('MiSalud API')
      .setDescription(
        'API de la cadena de droguerías MiSalud. ' +
          'Roles: super_admin (acceso total), supervisor (sucursales de su ciudad), vendedor (solo su sucursal).',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`MiSalud API running on http://localhost:${port}/api`);
  if (!isProduction) {
    console.log(`Swagger docs: http://localhost:${port}/api/docs`);
  }
}
bootstrap().catch((error) => {
  console.error('Error al iniciar la aplicación:', error);
  process.exit(1);
});
