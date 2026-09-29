import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class GenerateVideoDto {
  @IsString()
  prompt: string;

  @IsString()
  @IsOptional()
  model?: string = 'wan-3';

  @IsString()
  @IsOptional()
  provider?: string;

  @IsNumber()
  @IsOptional()
  @Min(3)
  @Max(30)
  duration?: number = 5;

  @IsString()
  @IsOptional()
  resolution?: string;

  @IsString()
  @IsOptional()
  aspectRatio?: string;

  @IsString()
  @IsOptional()
  inputImage?: string;

  @IsNumber()
  @IsOptional()
  fps?: number;

  @IsString()
  @IsOptional()
  style?: string;
}
