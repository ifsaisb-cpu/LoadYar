import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @UseGuards(AdminGuard)
  async getUsers(@Request() req: any) {
    return this.userService.getUsers(req.user.tenant_id);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  async getUserById(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.userService.getUserById(id, req.user.tenant_id);
  }

  @Post()
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.CREATED)
  async createUser(
    @Body() dto: CreateUserDto,
    @Request() req: any,
  ) {
    return this.userService.createUser(
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
    @Request() req: any,
  ) {
    return this.userService.updateUser(
      id,
      dto,
      req.user.tenant_id,
      req.user.username,
    );
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.OK)
  async deleteUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: any,
  ) {
    return this.userService.deleteUser(id, req.user.tenant_id);
  }
}
