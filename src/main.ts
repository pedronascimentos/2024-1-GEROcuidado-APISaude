import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import compression from 'compression';
import { json, urlencoded } from 'express';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './shared/filters/all-exceptions.filter';
import { ModelNotFoundExceptionFilter } from './shared/filters/model-not-found.exception-filter';
import { DataTransformInterceptor } from './shared/interceptors/data-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/saude');
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));
  app.use(helmet());
  app.use(compression());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new DataTransformInterceptor());

  app.useGlobalFilters(
    new AllExceptionsFilter(),
    new ModelNotFoundExceptionFilter(),
  );

  app.enableCors({
    origin: ['http://192.168.0.15', 'http://10.0.2.2', 'http://127.0.0.1', '0.0.0.0'], // Substitua pelos domínios reais usados
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Aqui está o ajuste para expor a API na rede
  await app.listen(3003, '0.0.0.0'); // Mudando para '0.0.0.0'
  console.log(`Application is running on: ${await app.getUrl()}`);
}
bootstrap();

