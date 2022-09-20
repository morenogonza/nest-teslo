import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number) // transform string to number from query enableImplicitConversions: true
  limit?: number;

  @IsOptional()
  @Type(() => Number) // transform string to number from query enableImplicitConversions: true
  offset?: number;
}
