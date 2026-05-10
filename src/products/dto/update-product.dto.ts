import { IsString, IsNumber, IsOptional, Min, IsInt } from 'class-validator'

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number

  @IsOptional()
  @IsInt()
  @Min(0)
  stock?: number
}
