import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength, ArrayMaxSize } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvana@example.com', description: 'Địa chỉ email của người dùng' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6, description: 'Mật khẩu ít nhất 6 ký tự' })
  @IsString({ message: 'Mật khẩu phải là chuỗi' })
  @MinLength(6, { message: 'Mật khẩu tối thiểu phải có 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên của người dùng' })
  @IsString({ message: 'Tên phải là chuỗi' })
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  @MinLength(2, { message: 'Tên tối thiểu phải có 2 ký tự' })
  name: string;

  @ApiPropertyOptional({ example: ['NestJS', 'Docker', 'MongoDB'], type: [String], description: 'Danh sách sở thích hoặc kỹ năng' })
  @IsOptional()
  @ArrayMaxSize(20, { message: 'Tối đa 20 kỹ năng/sở thích' })
  interests?: string[];
}
