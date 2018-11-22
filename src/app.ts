import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.model';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3010);
}
bootstrap();
