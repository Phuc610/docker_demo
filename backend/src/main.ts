import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Bật CORS cho phép frontend kết nối
  app.enableCors();

  // Tự động validate input request theo DTO
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Cấu hình tài liệu tự động Swagger UI
  const config = new DocumentBuilder()
    .setTitle('Dev Profile Hub API')
    .setDescription('Tài liệu API xác thực người dùng và quản lý hồ sơ (NestJS + MongoDB)')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Nhập access token nhận được sau khi đăng nhập',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.NEST_PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Ứng dụng NestJS đang chạy tại: http://localhost:${port}`);
  console.log(`📚 Tài liệu Swagger UI tại: http://localhost:${port}/api/docs`);
}

bootstrap();
