import { Body, Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('Xác thực (Auth)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Đăng ký tài khoản người dùng mới' })
  @ApiResponse({ status: 201, description: 'Đăng ký thành công, trả về token và thông tin user' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ (Validation Error)' })
  @ApiResponse({ status: 409, description: 'Email đã tồn tại' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập hệ thống' })
  @ApiResponse({ status: 200, description: 'Đăng nhập thành công, trả về Access Token' })
  @ApiResponse({ status: 401, description: 'Sai email hoặc mật khẩu' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Lấy thông tin tài khoản hiện tại (Yêu cầu JWT Token)' })
  @ApiResponse({ status: 200, description: 'Thông tin hồ sơ của người dùng đang đăng nhập' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập hoặc Token không hợp lệ' })
  async getProfile(@Request() req: any) {
    return req.user;
  }
}
