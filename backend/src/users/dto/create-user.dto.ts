import { IsEmail, IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @Length(2, 120)
  name!: string;

  @IsEmail()
  email!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(120)
  age?: number;

  @IsOptional()
  @IsIn(['admin', 'librarian', 'reader', 'guest'])
  role?: string;

  @IsOptional()
  @IsString()
  @Length(6, 80)
  password?: string;
}
