import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security headers (helmet)
  app.use(helmet());

  // Validation pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS for web frontend
  const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:5173';
  const allowedOrigins = corsOrigin.split(',').map(origin => origin.trim());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  });

  const PORT = process.env.PORT || 3001;
  await app.listen(PORT);
  console.log(`🚀 LoadYar API running on http://localhost:${PORT}`);
  console.log(`🔒 Security headers enabled (helmet)`);
  console.log(`📡 WebSocket (Socket.IO) enabled on ws://localhost:${PORT}`);
  console.log(`⏱️  Session timeout: 30 minutes`);
  console.log(`🔐 Rate limiting: 3 failed attempts → 15 min lockout`);
}

bootstrap();
