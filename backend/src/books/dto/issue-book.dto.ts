import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class IssueBookDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  readerId?: number;

  @IsOptional()
  @IsDateString()
  returnDate?: string;
}
