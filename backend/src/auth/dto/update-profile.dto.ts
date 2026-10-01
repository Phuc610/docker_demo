import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsEmail, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'Nguyễn Văn A', description: 'Họ và tên' })
  @IsOptional()
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  name?: string;

  @ApiPropertyOptional({ example: 'user@example.com', description: 'Địa chỉ email' })
  @IsOptional()
  @IsEmail({}, { message: 'Địa chỉ email không đúng định dạng' })
  email?: string;

  @ApiPropertyOptional({ example: ['NestJS', 'Docker', 'Kubernetes'], description: 'Danh sách sở thích / kỹ năng' })
  @IsOptional()
  @IsArray({ message: 'Sở thích phải là một mảng chuỗi' })
  interests?: string[];

  @ApiPropertyOptional({ example: 'Lập trình viên backend', description: 'Tiểu sử cá nhân' })
  @IsOptional()
  @IsString()
  bio?: string;
}
