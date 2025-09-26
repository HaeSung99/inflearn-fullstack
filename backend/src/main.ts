import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
  .setTitle('인프런 API 문서')
  .setDescription('인프런 API 문서 입니다')
  .setVersion('1.0')
  .addBearerAuth({
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: '엑세스 토큰을 넣어주세요',
    in: 'header'
  },
  'access-token'
)
.build()

const document = SwaggerModule.createDocument(app,config)
SwaggerModule.setup('docs', app, document)

  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
