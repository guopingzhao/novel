import { NestFactory } from '@nestjs/core';
// tslint:disable-next-line:import-spacing
import {ApplicationModule}  from './app.model';
import './test';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3010);
}
bootstrap();
