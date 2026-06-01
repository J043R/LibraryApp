import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../security/roles.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles('admin', 'librarian')
  findAll(@Query('search') search = '') {
    return this.usersService.findAll(search);
  }

  @Get(':id')
  @Roles('admin', 'librarian', 'reader')
  findOne(@Param('id') id: string, @Req() request: Request & { user?: any; role?: string }) {
    if (request.role === 'reader') {
      return this.usersService.findById(String(request.user.id));
    }
    return this.usersService.findById(id);
  }

  @Post()
  @Roles('admin')
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Put(':id')
  @Roles('admin')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
