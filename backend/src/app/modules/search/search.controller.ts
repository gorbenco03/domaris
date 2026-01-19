import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { SearchService } from './search.service';
import { Public } from '../../core/decorators.js';

@ApiTags('search')
@Controller('search')
export class SearchController {
    constructor(private readonly searchService: SearchService) { }

    @Public()
    @Get()
    @ApiOperation({ summary: 'Advanced Property Search' })
    async search(@Query() filters: any) {
        return this.searchService.search(filters);
    }

    @Public()
    @Get('suggestions')
    @ApiOperation({ summary: 'Search Autocomplete Suggestions' })
    async suggestions(@Query('q') query: string) {
        return this.searchService.suggestions(query);
    }

    @Public()
    @Get('map')
    @ApiOperation({ summary: 'Get Map Clustering Data' })
    async mapData(@Query() filters: any) {
        return this.searchService.getMapData(filters);
    }
}
