import { Module, forwardRef } from '@nestjs/common';
import { ViewingController } from './viewing.controller';
import { ViewingService } from './viewing.service';
import { NotificationModule } from '../notification/notification.module';
import { ReviewModule } from '../review/review.module';

@Module({
    imports: [NotificationModule, forwardRef(() => ReviewModule)],
    controllers: [ViewingController],
    providers: [ViewingService],
    exports: [ViewingService],
})
export class ViewingModule { }
