import { IsString, IsOptional } from 'class-validator'

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  note?: string
}
