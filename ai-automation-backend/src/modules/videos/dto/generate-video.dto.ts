import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
export class GenerateVideoDto {
  @IsString() prompt: string;
  @IsString() @IsOptional() @IsIn(['wan-t2v', 'kling-video', 'luma-dream-machine']) model?: string = 'wan-t2v';
  @IsString() @IsOptional() provider?: string;
  @IsNumber() @IsOptional() @Min(3) @Max(30) duration?: number = 5;
  @IsString() @IsOptional() resolution?: string;
  @IsNumber() @IsOptional() fps?: number;
  @IsString() @IsOptional() style?: string;
}
