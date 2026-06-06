import { Controller, Get, Header } from '@nestjs/common';
import { LogsService } from './logs.service';
import { Roles } from '../security/roles.decorator';

@Controller('logs')
@Roles('admin')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  @Header('Cache-Control', 'no-store')
  findAll() {
    return this.logsService.findAll();
  }
}
