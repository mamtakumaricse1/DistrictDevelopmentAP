import { Body, Controller, Get, Header, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { CurrentUser, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { ImportsService } from './imports.service';

class ImportCsvDto {
  @IsString()
  @MinLength(20)
  @MaxLength(500_000)
  csv!: string;
}

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly imports: ImportsService) {}

  @Get('templates/department.csv')
  @RequirePermissions('dashboard:read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="department-progress.csv"')
  @ApiOperation({ summary: 'Standard department Excel/CSV template from dash.pdf' })
  template() {
    return this.imports.template();
  }

  @Get('templates/:code')
  @RequirePermissions('dashboard:read')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  departmentTemplate(@Param('code') code: string) {
    return this.imports.template(code.replace(/\.csv$/i, ''));
  }

  @Post('validate')
  @RequirePermissions('progress:submit')
  @ApiOperation({ summary: 'Validate department CSV before publication to the DC dashboard' })
  validate(@CurrentUser() auth: AuthContext, @Body() body: ImportCsvDto) {
    return this.imports.validate(auth, body.csv);
  }

  @Post('progress')
  @RequirePermissions('progress:submit')
  @ApiOperation({ summary: 'Import department scheme progress from the standard CSV template' })
  importProgress(@CurrentUser() auth: AuthContext, @Body() body: ImportCsvDto) {
    return this.imports.importProgress(auth, body.csv);
  }
}
