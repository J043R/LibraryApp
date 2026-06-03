import { Controller, Get } from '@nestjs/common';
@Controller()
export class AppController {
  @Get()
  health() {
    return {
      message: 'Library API is running',
      stack: 'NestJS + SQLite'
    };
  }
}
