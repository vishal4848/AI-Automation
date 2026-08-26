import { IsOptional, IsString } from 'class-validator';

export class UploadAssetDto {
  @IsOptional()
  @IsString()
  projectId?: string;
}
