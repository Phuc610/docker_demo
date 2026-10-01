import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const newUser = await this.usersService.create({
      name: dto.name,
      email: dto.email,
      password: hashedPassword,
      interests: dto.interests || [],
    });

    const token = this.generateToken(newUser);

    return {
      message: 'Đăng ký tài khoản thành công',
      user: newUser.toJSON(),
      accessToken: token,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmailWithPassword(dto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const isPasswordMatching = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordMatching) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác');
    }

    const token = this.generateToken(user);

    return {
      message: 'Đăng nhập thành công',
      user: user.toJSON(),
      accessToken: token,
    };
  }

  private generateToken(user: UserDocument): string {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return this.jwtService.sign(payload);
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    const updated = await this.usersService.update(userId, { avatar: avatarUrl });
    return {
      message: 'Cập nhật ảnh đại diện thành công',
      avatarUrl: updated.avatar,
      user: updated.toJSON(),
    };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersService.findByIdWithPassword(userId);
    if (!user) {
      throw new BadRequestException('Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('Mật khẩu mới không được trùng với mật khẩu hiện tại');
    }

    const saltRounds = 10;
    const hashed = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.usersService.update(userId, { password: hashed });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  async updateProfile(userId: string | any, dto: UpdateProfileDto) {
    const idStr = userId.toString();
    const currentUser = await this.usersService.findById(idStr);

    if (dto.email && dto.email.toLowerCase().trim() !== currentUser.email.toLowerCase().trim()) {
      const existing = await this.usersService.findByEmail(dto.email.trim());
      if (existing && existing._id.toString() !== idStr) {
        throw new ConflictException('Email này đã được sử dụng bởi một tài khoản khác');
      }
    }

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name.trim();
    if (dto.email !== undefined) updateData.email = dto.email.toLowerCase().trim();
    if (dto.interests !== undefined) updateData.interests = dto.interests;
    if (dto.bio !== undefined) updateData.bio = dto.bio;

    const updatedUser = await this.usersService.update(idStr, updateData);
    const token = this.generateToken(updatedUser);

    return {
      message: 'Cập nhật hồ sơ thành công',
      user: updatedUser.toJSON(),
      accessToken: token,
    };
  }
}

