import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { BooksController } from './books/books.controller';
import { BooksService } from './books/books.service';
import { LogsController } from './logs/logs.controller';
import { LogsService } from './logs/logs.service';
import { DatabaseModule } from './database/database.module';
import { RolesGuard } from './security/roles.guard';
import { TokenService } from './security/token.service';
import { UsersController } from './users/users.controller';
import { UsersService } from './users/users.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppController, AuthController, BooksController, LogsController, UsersController],
  providers: [
    AuthService,
    BooksService,
    LogsService,
    TokenService,
    UsersService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard
    }
  ]
})
export class AppModule {}
