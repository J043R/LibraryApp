import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { bookDto, borrowedBookDto } from '../common/mappers';
import { DatabaseService } from '../database/database.service';
import { CreateBookDto } from './dto/create-book.dto';

type BookRow = {
  id: number;
  title: string;
  author: string;
  year: number | null;
  image: string;
  available: number;
  reader_id: number | null;
  return_date: string | null;
};

@Injectable()
export class BooksService {
  constructor(private readonly database: DatabaseService) {}

  findAll(search = '') {
    const query = `%${search.trim().toLocaleLowerCase('ru-RU')}%`;
    return this.database
      .all<BookRow>(
        `${this.bookSelect()}
         WHERE normalize_text(b.title) LIKE ? OR normalize_text(b.author) LIKE ?
         ORDER BY b.id`,
        query,
        query
      )
      .map(bookDto);
  }

  findOne(id: string | number) {
    const book = this.database.get<BookRow>(
      `${this.bookSelect()} WHERE CAST(b.id AS INTEGER) = ?`,
      Number(id)
    );
    if (!book) throw new NotFoundException('Книга не найдена');
    return bookDto(book);
  }

  create(dto: CreateBookDto) {
    const id = this.database.nextId('books');
    this.database.run(
      'INSERT INTO books (id, title, author, year, image) VALUES (?, ?, ?, ?, ?)',
      id,
      dto.title,
      dto.author,
      dto.year ?? null,
      dto.image || ''
    );
    this.database.writeLog('Добавлена книга', 'librarian', `${dto.title} / ${dto.author}`);
    return this.findOne(id);
  }

  remove(id: string) {
    const book = this.findOne(id);
    this.database.run('DELETE FROM books WHERE CAST(id AS INTEGER) = ?', Number(id));
    this.database.writeLog('Удалена книга', 'admin', `book_id=${id}`);
    return book;
  }

  findBorrowed(activeOnly = true) {
    const condition = activeOnly ? 'WHERE bb.returned_at IS NULL' : '';
    return this.database
      .all(
        `SELECT bb.*, b.title AS book_title, b.author AS book_author,
                u.name AS reader_name, u.email AS reader_email
         FROM borrowed_books bb
         JOIN books b ON b.id = bb.book_id
         JOIN users u ON u.id = bb.reader_id
         ${condition}
         ORDER BY bb.id DESC`
      )
      .map(borrowedBookDto);
  }

  issue(bookId: string, readerId: string | number, returnDate?: string) {
    const book = this.database.get<{ id: number; available: number }>(
      'SELECT id, available FROM books WHERE CAST(id AS INTEGER) = ?',
      Number(bookId)
    );
    if (!book) throw new NotFoundException('Книга не найдена');
    if (!book.available) throw new BadRequestException('Книга уже выдана');

    const reader = this.database.get<{ id: number }>(
      `SELECT id FROM users WHERE CAST(id AS INTEGER) = ? AND role = 'reader'`,
      Number(readerId)
    );
    if (!reader) throw new BadRequestException('Читатель не найден');

    this.database.transaction(() => {
      this.database.run(
        `INSERT INTO borrowed_books (id, book_id, reader_id, issued_at, return_date)
         VALUES (?, ?, ?, ?, ?)`,
        this.database.nextId('borrowed_books'),
        book.id,
        reader.id,
        new Date().toISOString(),
        returnDate || this.defaultReturnDate()
      );
      this.database.run(
        'UPDATE books SET available = 0 WHERE CAST(id AS INTEGER) = ?',
        Number(book.id)
      );
      this.database.writeLog('Выдача книги', 'librarian', `book_id=${book.id}; reader_id=${reader.id}`);
    });
    return this.findOne(book.id);
  }

  returnBook(bookId: string) {
    const borrowed = this.database.get<{ id: number }>(
      `SELECT id FROM borrowed_books
       WHERE CAST(book_id AS INTEGER) = ? AND returned_at IS NULL
       ORDER BY id DESC LIMIT 1`,
      Number(bookId)
    );
    if (!borrowed) throw new BadRequestException('Активная выдача книги не найдена');

    this.database.transaction(() => {
      this.database.run(
        'UPDATE borrowed_books SET returned_at = ? WHERE id = ?',
        new Date().toISOString(),
        borrowed.id
      );
      this.database.run(
        'UPDATE books SET available = 1 WHERE CAST(id AS INTEGER) = ?',
        Number(bookId)
      );
      this.database.writeLog('Возврат книги', 'librarian', `book_id=${bookId}`);
    });
    return this.findOne(bookId);
  }

  private bookSelect() {
    return `
      SELECT b.*, bb.reader_id, bb.return_date
      FROM books b
      LEFT JOIN borrowed_books bb
        ON bb.book_id = b.id AND bb.returned_at IS NULL
    `;
  }

  private defaultReturnDate() {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
