import { IsString, IsOptional, IsNumber, IsBoolean, Min, Max, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateImageDto {
  @ApiProperty({ example: 'A futuristic city at sunset, cyberpunk style' })
  @IsString()
  prompt: string;

  @IsString() @IsOptional()
  negativePrompt?: string;

  @IsString() @IsOptional()
  model?: string = 'flux-schnell';

  @IsString() @IsOptional()
  provider?: string;

  @IsString() @IsOptional()
  style?: string;

  @IsString() @IsOptional()
  ratio?: string;

  @IsNumber() @IsOptional() @Min(256) @Max(2048)
  width?: number;

  @IsNumber() @IsOptional() @Min(256) @Max(2048)
  height?: number;

  @IsNumber() @IsOptional() @Min(1) @Max(150)
  steps?: number;

  @IsBoolean() @IsOptional()
  enhancePrompt?: boolean = false;

  @IsString() @IsOptional()
  projectId?: string;

  @ApiProperty({ example: 'https://example.com/ref.png', required: false })
  @IsString()
  @IsOptional()
  referenceImage?: string;

  @ApiProperty({ example: ['https://example.com/ref.png'], required: false })
  @IsOptional()
  referenceImages?: string[];

  @IsNumber() @IsOptional() @Min(1) @Max(4)
  numImages?: number = 1;
}
