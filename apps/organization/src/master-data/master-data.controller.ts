import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { CurrentUser, IsUuidLike, RequirePermissions, type AuthContext } from '@ddwmd/common';
import { CreateMasterCategoryDto, CreateMasterItemDto, UpdateMasterItemDto } from './dto/master-data.dto';
import { MasterDataService } from './master-data.service';

class MasterItemQueryDto {
  @IsOptional()
  @IsUuidLike()
  categoryId?: string;

  @IsOptional()
  @IsUuidLike()
  districtId?: string;
}

@ApiTags('master-data')
@ApiBearerAuth()
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly master: MasterDataService) {}

  @Get('categories')
  @RequirePermissions('master:manage')
  categories() {
    return this.master.categories();
  }

  @Post('categories')
  @RequirePermissions('master:manage')
  createCategory(@Body() body: CreateMasterCategoryDto) {
    return this.master.createCategory(body);
  }

  @Get('items')
  @RequirePermissions('master:manage')
  items(@CurrentUser() auth: AuthContext, @Query() query: MasterItemQueryDto) {
    return this.master.items(auth, query.categoryId, query.districtId);
  }

  @Post('items')
  @RequirePermissions('master:manage')
  createItem(@CurrentUser() auth: AuthContext, @Body() body: CreateMasterItemDto) {
    return this.master.createItem(auth, body);
  }

  @Patch('items/:id')
  @RequirePermissions('master:manage')
  updateItem(
    @CurrentUser() auth: AuthContext,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateMasterItemDto,
  ) {
    return this.master.updateItem(auth, id, body);
  }
}
