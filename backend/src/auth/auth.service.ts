import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { publicUser } from '../common/mappers';
import { TokenService } from '../security/token.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly tokenService: TokenService
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findPrivateByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new UnauthorizedException('Неверный email или пароль');
    }

    return {
      ...publicUser(user),
      token: this.tokenService.sign({ id: user.id, role: user.role })
    };
  }

  async register(dto: RegisterDto) {
    await this.usersService.registerReader(dto);
    return this.login(dto.email, dto.password);
  }
}
