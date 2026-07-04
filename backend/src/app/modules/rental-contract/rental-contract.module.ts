import { Module } from '@nestjs/common';
import { RentalContractController } from './rental-contract.controller.js';
import { RentalContractService } from './rental-contract.service.js';
import { NotificationModule } from '../notification/notification.module.js';

@Module({
    imports: [NotificationModule],
    controllers: [RentalContractController],
    providers: [RentalContractService],
    exports: [RentalContractService],
})
export class RentalContractModule {}
