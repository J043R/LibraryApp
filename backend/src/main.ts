import 'reflect-metadata';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ApplicationExceptionFilter } from './common/application-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const port = Number(process.env.PORT || 3000);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalFilters(new ApplicationExceptionFilter());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useStaticAssets(join(__dirname, '../../frontend'), { prefix: '/' });

  await app.listen(port);
  console.log(`Сервер запущен: http://localhost:${port}`);
}

bootstrap();
