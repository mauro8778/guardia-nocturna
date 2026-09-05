import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const cleanEmail = registerDto.email.trim().toLowerCase();
    const existingUser = await this.usersService.findByEmail(cleanEmail);
    if (existingUser) {
      throw new ConflictException('El correo electrónico ya se encuentra registrado');
    }

    // Asignar rol ADMIN si la petición especifica role === 'ADMIN' o es email admin@
    const isTeacher = registerDto.role === 'ADMIN' || cleanEmail.includes('admin');
    const assignedRole = isTeacher ? 'ADMIN' : 'STUDENT';

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    const newUser = await this.usersService.create({
      email: cleanEmail,
      password: hashedPassword,
      fullName: registerDto.fullName,
      phone: registerDto.phone || '',
      role: assignedRole,
    });

    const token = this.jwtService.sign({
      sub: newUser.id,
      email: newUser.email,
      role: newUser.role,
    });

    return {
      access_token: token,
      user: {
        id: newUser.id,
        userId: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        role: newUser.role,
        phone: newUser.phone,
        status: newUser.status,
        commissionRate: newUser.commissionRate,
        applyCommission: newUser.applyCommission,
        membershipType: newUser.membershipType,
        membershipStatus: newUser.membershipStatus,
        trialEndsAt: newUser.trialEndsAt,
        membershipPaidUntil: newUser.membershipPaidUntil,
      },
    };
  }

  async login(loginDto: LoginDto) {
    const cleanEmail = loginDto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        phone: user.phone,
        status: user.status,
        commissionRate: user.commissionRate,
        applyCommission: user.applyCommission,
        membershipType: user.membershipType,
        membershipStatus: user.membershipStatus,
        trialEndsAt: user.trialEndsAt,
        membershipPaidUntil: user.membershipPaidUntil,
      },
    };
  }

  async resetPassword(email: string, newPassword: string) {
    const cleanEmail = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(cleanEmail);
    if (!user) {
      throw new NotFoundException('No se encontró ninguna cuenta asociada a este correo electrónico');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updatedUser = await this.usersService.updatePassword(cleanEmail, hashedPassword);

    const token = this.jwtService.sign({
      sub: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role,
    });

    return {
      access_token: token,
      user: {
        id: updatedUser.id,
        userId: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        phone: updatedUser.phone,
        status: updatedUser.status,
        commissionRate: updatedUser.commissionRate,
        applyCommission: updatedUser.applyCommission,
        membershipType: updatedUser.membershipType,
        membershipStatus: updatedUser.membershipStatus,
        trialEndsAt: updatedUser.trialEndsAt,
        membershipPaidUntil: updatedUser.membershipPaidUntil,
      },
      message: 'Contraseña actualizada e inicio de sesión automático concedido.',
    };
  }
}
