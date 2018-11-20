import { Module } from '@nestjs/common';
import { UsersController } from "./routes/list";

@Module({
  controllers: [UsersController]
})
export class ApplicationModule {}