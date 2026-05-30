import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { DatabaseSync } from 'node:sqlite';

export type UserRecord = {
  id: number | string;
  name: string;
  email: string;
  age: number | null;
  role: string;
  password_hash: string;
};

@Injectable()
export class DatabaseService implements OnModuleDestroy {
  private readonly database: DatabaseSync;

  constructor() {
    const databasePath = process.env.DATABASE_PATH
      ? join(process.cwd(), process.env.DATABASE_PATH)
      : join(process.cwd(), 'data', 'library.sqlite');
    mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec('PRAGMA foreign_keys = ON');
    this.createSchema();
    this.seed();
  }

  all<T>(sql: string, ...params: any[]) {
    return this.database.prepare(sql).all(...params) as T[];
  }

  get<T>(sql: string, ...params: any[]) {
    return this.database.prepare(sql).get(...params) as T | undefined;
  }

  run(sql: string, ...params: any[]) {
    return this.database.prepare(sql).run(...params);
  }

  transaction<T>(callback: () => T) {
    this.database.exec('BEGIN');
    try {
      const result = callback();
      this.database.exec('COMMIT');
      return result;
    } catch (error) {
      this.database.exec('ROLLBACK');
      throw error;
    }
  }

  writeLog(action: string, role = 'guest', details = '') {
    this.run(
      'INSERT INTO logs (id, action, role, details, created_at) VALUES (?, ?, ?, ?, ?)',
      this.nextId('logs'),
      action,
      role,
      details,
      new Date().toISOString()
    );
  }

  nextId(table: 'users' | 'books' | 'borrowed_books' | 'logs') {
    const row = this.get<{ next_id: number }>(
      `SELECT COALESCE(MAX(CAST(id AS INTEGER)), 0) + 1 AS next_id FROM ${table}`
    );
    return row?.next_id || 1;
  }

  onModuleDestroy() {
    this.database.close();
  }

  private createSchema() {
    this.database.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        age INTEGER,
        role TEXT NOT NULL DEFAULT 'reader'
          CHECK (role IN ('admin', 'librarian', 'reader', 'guest')),
        password_hash TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        year INTEGER,
        image TEXT NOT NULL DEFAULT '',
        available INTEGER NOT NULL DEFAULT 1 CHECK (available IN (0, 1))
      );

      CREATE TABLE IF NOT EXISTS borrowed_books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        book_id INTEGER NOT NULL,
        reader_id INTEGER NOT NULL,
        issued_at TEXT NOT NULL,
        return_date TEXT NOT NULL,
        returned_at TEXT,
        FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
        FOREIGN KEY (reader_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT NOT NULL,
        role TEXT NOT NULL,
        details TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
    `);
  }

  private seed() {
    const row = this.get<{ count: number }>('SELECT COUNT(*) AS count FROM users');
    if (row?.count) return;

    this.transaction(() => {
      const users = [
        ['Бодрова Александра', 'bodrova@example.com', 19, 'admin', '$2a$10$hoN3SbSqUrftUYABXdO4oez7xpuHt1S5Bf5nnuyWCW59qvcX3gCfC'],
        ['Ладыгин Максим', 'ladygin@example.com', 20, 'librarian', '$2a$10$6QmQFmA5D1p.xWMHwAJ28eOPxmMrtE1y.dIfLTP0nCCsJrqtx1mZm'],
        ['Иван Сидоров', 'ivan@example.com', 19, 'reader', '$2a$10$faL13PCXmD4VnWXYhCRL7OTB8xWukcIRnPtf7gqdkqlxvONgtX9HW']
      ];
      for (const user of users) {
        this.run(
          'INSERT INTO users (id, name, email, age, role, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
          this.nextId('users'),
          ...user
        );
      }

      const books = [
        ['Преступление и наказание', 'Фёдор Достоевский', 1866],
        ['Война и мир', 'Лев Толстой', 1869],
        ['Мастер и Маргарита', 'Михаил Булгаков', 1967],
        ['Отцы и дети', 'Иван Тургенев', 1862],
        ['Евгений Онегин', 'Александр Пушкин', 1833],
        ['Герой нашего времени', 'Михаил Лермонтов', 1840],
        ['Собачье сердце', 'Михаил Булгаков', 1925],
        ['Капитанская дочка', 'Александр Пушкин', 1836]
      ];
      for (const book of books) {
        this.run(
          'INSERT INTO books (id, title, author, year) VALUES (?, ?, ?, ?)',
          this.nextId('books'),
          ...book
        );
      }

      const issuedAt = new Date().toISOString();
      this.run(
        `INSERT INTO borrowed_books (id, book_id, reader_id, issued_at, return_date)
         VALUES (?, 1, 3, ?, ?)`,
        this.nextId('borrowed_books'),
        issuedAt,
        this.dateAfterDays(14)
      );
      this.run('UPDATE books SET available = 0 WHERE id = 1');
      this.writeLog('Запуск приложения', 'system', 'Начальные данные добавлены в SQLite');
    });
  }

  private dateAfterDays(days: number) {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
