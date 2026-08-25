import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString({ message: 'Project name must be a string' })
  @MaxLength(100, { message: 'Project name must be at most 100 characters' })
  name?: string;

  @IsOptional()
  @IsString({ message: 'Description must be a string' })
  @MaxLength(500, { message: 'Description must be at most 500 characters' })
  description?: string;

  @IsOptional()
  @IsString()
  status?: 'active' | 'archived' | 'completed';
}
