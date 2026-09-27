import { Logger, ValidationPipe, type Type } from '@nestjs/common';
import { validationException } from './http/friendly-error';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

type BootstrapOptions = {
  service: string;
  defaultPort: number;
  swagger?: boolean;
  bodyParser?: boolean;
};

export async function bootstrapService(module: Type<unknown>, options: BootstrapOptions): Promise<void> {
  process.env.SERVICE_NAME = options.service;
  process.env.APP_NAME = process.env.APP_NAME ?? `ddwmd-${options.service}`;

  const app = await NestFactory.create(module, {
    bufferLogs: true,
    bodyParser: options.bodyParser !== false,
  });
  const logger = new Logger('Bootstrap');
  const port = Number(process.env[`${options.service.toUpperCase()}_PORT`] ?? options.defaultPort);
  const webOrigin = process.env.WEB_ORIGIN ?? 'http://localhost:5173';

  app.use(helmet());
  app.enableCors({
    origin: webOrigin.split(',').map((value) => value.trim()),
    credentials: true,
  });
  app.setGlobalPrefix(process.env.API_PREFIX ?? 'api/v1');

  if (options.swagger !== false) {
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: validationException,
      }),
    );
    const swagger = new DocumentBuilder()
      .setTitle('District Development Works Monitoring API')
      .setDescription(
        `Service: ${options.service}. Authorization is enforced in this process, not only at the gateway.`,
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));
  }

  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  logger.log(`${options.service} listening on 0.0.0.0:${port} (${process.env.NODE_ENV ?? 'development'})`);
}
