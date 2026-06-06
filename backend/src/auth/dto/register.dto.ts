import { Type } from 'class-transformer';
import { IsEmail, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class RegisterDto {
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

  @IsString()
  @Length(6, 80)
  password!: string;
}
