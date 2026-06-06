import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { publicUser } from '../common/mappers';
import { DatabaseService, UserRecord } from '../database/database.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

type NewUserData = {
  name: string;
  email: string;
  age?: number;
  password?: string;
  role: string;
};

@Injectable()
export class UsersService {
  constructor(private readonly database: DatabaseService) {}

  findAll(search = '') {
    const query = `%${search.trim().toLowerCase()}%`;
    return this.database
      .all<UserRecord>(
        `SELECT * FROM users
         WHERE lower(name) LIKE ? OR lower(email) LIKE ? OR lower(role) LIKE ?
         ORDER BY id`,
        query,
        query,
        query
      )
      .map(publicUser);
  }

  findById(id: string | number) {
    const user = this.findPrivateById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');
    return publicUser(user);
  }

  findPrivateById(id: string | number) {
    return this.database.get<UserRecord>(
      'SELECT * FROM users WHERE CAST(id AS INTEGER) = ?',
      Number(id)
    ) || null;
  }

  findPrivateByEmail(email: string) {
    return this.database.get<UserRecord>(
      'SELECT * FROM users WHERE lower(email) = lower(?)',
      email
    ) || null;
  }

  async create(dto: CreateUserDto) {
    return this.createUser({
      ...dto,
      role: dto.role || 'reader'
    }, 'admin');
  }

  async registerReader(dto: { name: string; email: string; age?: number; password: string }) {
    return this.createUser({
      ...dto,
      role: 'reader'
    }, 'guest');
  }

  private async createUser(dto: NewUserData, actorRole: string) {
    if (this.findPrivateByEmail(dto.email)) {
      throw new ConflictException('Пользователь с таким email уже существует');
    }

    const passwordHash = await bcrypt.hash(dto.password || 'Reader123', 10);
    const id = this.database.nextId('users');
    this.database.run(
      `INSERT INTO users (id, name, email, age, role, password_hash)
       VALUES (?, ?, ?, ?, ?, ?)`,
      id,
      dto.name,
      dto.email,
      dto.age ?? null,
      dto.role,
      passwordHash
    );
    const user = this.findPrivateById(id);
    this.database.writeLog('Создан пользователь', actorRole, `${dto.email} / ${dto.role}`);
    return publicUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = this.findPrivateById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');

    if (dto.email) {
      const existing = this.findPrivateByEmail(dto.email);
      if (existing && existing.id !== user.id) {
        throw new ConflictException('Пользователь с таким email уже существует');
      }
    }

    const passwordHash = dto.password
      ? await bcrypt.hash(dto.password, 10)
      : user.password_hash;
    this.database.run(
      `UPDATE users
       SET name = ?, email = ?, age = ?, role = ?, password_hash = ?
       WHERE CAST(id AS INTEGER) = ?`,
      dto.name ?? user.name,
      dto.email ?? user.email,
      dto.age ?? user.age,
      dto.role ?? user.role,
      passwordHash,
      user.id
    );
    this.database.writeLog('Изменён пользователь', 'admin', `user_id=${user.id}`);
    return this.findById(user.id);
  }

  remove(id: string) {
    const user = this.findPrivateById(id);
    if (!user) throw new NotFoundException('Пользователь не найден');

    this.database.run('DELETE FROM users WHERE CAST(id AS INTEGER) = ?', Number(user.id));
    this.database.writeLog('Удалён пользователь', 'admin', `user_id=${user.id}`);
    return publicUser(user);
  }
}
