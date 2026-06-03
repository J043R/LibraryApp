import { IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateBookDto {
  @IsString()
  @Length(1, 200)
  title!: string;

  @IsString()
  @Length(1, 160)
  author!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2100)
  year?: number;

  @IsOptional()
  @IsString()
  image?: string;
}
