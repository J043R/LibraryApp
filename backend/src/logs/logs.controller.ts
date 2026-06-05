import { Controller, Get } from '@nestjs/common';
import { LogsService } from './logs.service';
import { Roles } from '../security/roles.decorator';

@Controller('logs')
@Roles('admin')
export class LogsController {
  constructor(private readonly logsService: LogsService) {}

  @Get()
  findAll() {
    return this.logsService.findAll();
  }
}
