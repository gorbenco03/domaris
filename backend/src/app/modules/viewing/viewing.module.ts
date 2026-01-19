import { Module } from '@nestjs/common';
import { ViewingController } from './viewing.controller';
import { ViewingService } from './viewing.service';

@Module({
    controllers: [ViewingController],
    providers: [ViewingService],
})
export class ViewingModule { }
