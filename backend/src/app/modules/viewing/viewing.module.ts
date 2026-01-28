import { Module } from '@nestjs/common';
import { ViewingController } from './viewing.controller';
import { ViewingService } from './viewing.service';
import { NotificationModule } from '../notification/notification.module';

@Module({
    imports: [NotificationModule],
    controllers: [ViewingController],
    providers: [ViewingService],
})
export class ViewingModule { }
