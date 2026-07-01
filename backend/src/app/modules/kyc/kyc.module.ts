import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { KycController } from './kyc.controller';
import { KycService } from './kyc.service';
// S3Module este @Global(), deci S3Service este disponibil fără import explicit al modulului.
// Totuși îl declarăm explicit pentru claritate și InjectConnection.

@Module({
    imports: [
        SequelizeModule.forFeature([]), // Asigură accesul la @InjectConnection()
    ],
    controllers: [KycController],
    providers: [KycService],
})
export class KycModule { }
