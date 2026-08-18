import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { PDFParse } from 'pdf-parse';
import { ContasService } from './contas.service';
import { ContaEntity } from '../../entities/conta.entity';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';

@Controller('contas')
@UseGuards(SupabaseAuthGuard)
export class ContasController {
  constructor(private readonly service: ContasService) {}

  @Get()
  findAll(): Promise<ContaEntity[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ContaEntity | null> {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() dto: Partial<ContaEntity>): Promise<ContaEntity> {
    return this.service.create(dto);
  }

  @Post('upload-fatura/neoenergia')
  @UseInterceptors(FileInterceptor('arquivo', { storage: memoryStorage() }))
  async uploadFaturaNeoenergia(
    @UploadedFile() arquivo: Express.Multer.File,
  ): Promise<ContaEntity> {
    if (!arquivo) {
      throw new BadRequestException('Nenhum arquivo enviado (campo "arquivo").');
    }

    const parser = new PDFParse({ data: arquivo.buffer });
    const { text } = await parser.getText();

    return this.service.createFromFaturaPdfNeoenergia(text);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: Partial<ContaEntity>,
  ): Promise<ContaEntity | null> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.service.remove(id);
  }
}
