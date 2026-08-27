import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { setDefaultResultOrder } from 'node:dns';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';

setDefaultResultOrder('ipv4first');

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Comprovantes (PIX / recibos) são enviados como base64 no corpo JSON.
  // O limite padrão do Express (100kb) rejeita qualquer anexo real.
  app.use(json({ limit: '15mb' }));
  app.use(urlencoded({ extended: true, limit: '15mb' }));

  const allowedOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization, X-API-KEY',
    credentials: true,
  });

  app.setGlobalPrefix('api', { exclude: ['health'] });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🚀 Duzia Backend running on http://localhost:${port}/api`);
}
bootstrap();
