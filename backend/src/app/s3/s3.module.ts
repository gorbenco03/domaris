import AWS from 'aws-sdk';
import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

@Global()
@Module({
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: () => {
        return new AWS.S3({
          region: process.env.AWS_REGION,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });
      },
    },
    S3Service,
  ],
  exports: [S3Service, 'S3_CLIENT'],
})
export class S3Module {}
