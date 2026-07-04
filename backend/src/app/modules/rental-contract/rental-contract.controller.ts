import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    ParseIntPipe,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { RentalContractService } from './rental-contract.service.js';
import { ProposeContractDto } from './rental-contract.dto.js';
import { CurrentUserId } from '../../core/decorators.js';
import { AuthGuard } from '../../auth/auth.guard';

@ApiTags('contracts')
@Controller()
@UseGuards(AuthGuard)
@ApiBearerAuth()
export class RentalContractController {
    constructor(private readonly rentalContractService: RentalContractService) {}

    // =========================================================================
    // POST /viewings/:id/propose-contract
    // =========================================================================

    @Post('viewings/:id/propose-contract')
    @ApiOperation({
        summary: 'Propose a rental contract',
        description: 'Owner proposes a contract after the viewing is completed.',
    })
    @ApiResponse({ status: 201, description: 'Contract proposed' })
    async proposeContract(
        @CurrentUserId() userId: number,
        @Param('id', ParseIntPipe) viewingId: number,
        @Body() dto: ProposeContractDto,
    ) {
        return this.rentalContractService.proposeContract(userId, viewingId, dto);
    }

    // =========================================================================
    // GET /contracts/mine
    // =========================================================================

    @Get('contracts/mine')
    @ApiOperation({ summary: 'Get my contracts (as owner or seeker)' })
    @ApiResponse({ status: 200, description: 'List of contracts' })
    async getMyContracts(@CurrentUserId() userId: number) {
        return this.rentalContractService.getMyContracts(userId);
    }

    // =========================================================================
    // GET /contracts/:id
    // =========================================================================

    @Get('contracts/:id')
    @ApiOperation({ summary: 'Get contract details' })
    @ApiResponse({ status: 200, description: 'Contract details' })
    async getContract(
        @CurrentUserId() userId: number,
        @Param('id', ParseIntPipe) contractId: number,
    ) {
        return this.rentalContractService.getContract(userId, contractId);
    }

    // =========================================================================
    // POST /contracts/:id/accept
    // =========================================================================

    @Post('contracts/:id/accept')
    @ApiOperation({ summary: 'Accept a proposed contract (seeker)' })
    @ApiResponse({ status: 200, description: 'Contract accepted' })
    async acceptContract(
        @CurrentUserId() userId: number,
        @Param('id', ParseIntPipe) contractId: number,
    ) {
        return this.rentalContractService.acceptContract(userId, contractId);
    }

    // =========================================================================
    // POST /contracts/:id/sign
    // =========================================================================

    @Post('contracts/:id/sign')
    @ApiOperation({
        summary: 'Sign a contract (owner or seeker)',
        description: 'Sets signedByOwnerAt or signedBySeekerAt. When both are set, status becomes "signed" and listing is marked as rented.',
    })
    @ApiResponse({ status: 200, description: 'Contract signed' })
    async signContract(
        @CurrentUserId() userId: number,
        @Param('id', ParseIntPipe) contractId: number,
    ) {
        return this.rentalContractService.signContract(userId, contractId);
    }
}
