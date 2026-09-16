import { Body, Controller, Get, Header, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, type AuthContext } from '@ddwmd/common';
import { ActionStatus } from '../generated/prisma';
import { CreateActionDto, UpdateActionDto } from './dto/action.dto';
import { ActionsService } from './actions.service';

class ActionQueryDto {
  @IsOptional()
  @IsUuidLike()
  districtId?: string;

  @IsOptional()
  @IsUuidLike()
  departmentId?: string;

  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;
}

@ApiTags('actions')
@ApiBearerAuth()
@Controller()
export class ActionsController {
  constructor(private readonly actions: ActionsService) {}

  @Get('actions')
  @ApiOperation({ summary: 'List action items in the caller scope' })
  list(@CurrentUser() auth: AuthContext, @Query() query: ActionQueryDto) {
    return this.actions.list(auth, query);
  }

  @Post('actions')
  @ApiOperation({ summary: 'Create an action item' })
  create(@CurrentUser() auth: AuthContext, @Body() body: CreateActionDto) {
    return this.actions.create(auth, body);
  }

  @Patch('actions/:id')
  update(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateActionDto,
  ) {
    return this.actions.update(auth, id, body);
  }

  @Get('governance/summary')
  summary(@CurrentUser() auth: AuthContext) {
    return this.actions.summary(auth);
  }

  @Get('reports/actions.csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="actions.csv"')
  csv(@CurrentUser() auth: AuthContext) {
    return this.actions.csv(auth);
  }
}
