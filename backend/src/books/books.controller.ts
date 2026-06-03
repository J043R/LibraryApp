import { Body, Controller, Delete, ForbiddenException, Get, Param, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { Roles } from '../security/roles.decorator';
import { BooksService } from './books.service';
import { CreateBookDto } from './dto/create-book.dto';
import { IssueBookDto } from './dto/issue-book.dto';

type RequestWithUser = Request & {
  user?: { id: number; role: string };
  role?: string;
};

@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Get()
  @Roles('admin', 'librarian', 'reader')
  findAll(@Query('search') search = '') {
    return this.booksService.findAll(search);
  }

  @Get('borrowed')
  @Roles('admin', 'librarian')
  findBorrowed(@Query('all') all?: string) {
    return this.booksService.findBorrowed(all !== 'true');
  }

  @Get(':id')
  @Roles('admin', 'librarian', 'reader')
  findOne(@Param('id') id: string) {
    return this.booksService.findOne(id);
  }

  @Post()
  @Roles('admin', 'librarian')
  create(@Body() dto: CreateBookDto) {
    return this.booksService.create(dto);
  }

  @Delete(':id')
  @Roles('admin')
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }

  @Post(':id/issue')
  @Roles('admin', 'librarian', 'reader')
  issue(@Param('id') id: string, @Body() dto: IssueBookDto, @Req() request: RequestWithUser) {
    const readerId = request.role === 'reader' ? request.user?.id : dto.readerId;
    return this.booksService.issue(id, readerId || '', dto.returnDate);
  }

  @Post(':id/return')
  @Roles('admin', 'librarian', 'reader')
  async returnBook(@Param('id') id: string, @Req() request: RequestWithUser) {
    if (request.role === 'reader') {
      const book = await this.booksService.findOne(id);
      if (!book || String(book.readerId) !== String(request.user?.id)) {
        throw new ForbiddenException('Читатель может вернуть только свою книгу');
      }
    }
    return this.booksService.returnBook(id);
  }
}
