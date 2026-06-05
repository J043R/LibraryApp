import { Injectable } from '@nestjs/common';
import { logDto } from '../common/mappers';
import { DatabaseService } from '../database/database.service';

@Injectable()
export class LogsService {
  constructor(private readonly database: DatabaseService) {}

  write(action: string, role = 'guest', details = '') {
    this.database.writeLog(action, role, details);
  }

  findAll() {
    return this.database
      .all('SELECT * FROM logs ORDER BY id DESC')
      .map(logDto);
  }
}
