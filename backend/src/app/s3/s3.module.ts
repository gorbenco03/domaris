import AWS from 'aws-sdk';
import { Global, Module } from '@nestjs/common';
import { S3Service } from './s3.service';

// DigitalOcean: endpoint defines actual region; SDK expects region: 'us-east-1' (see DO docs)
const doRegion = process.env.DO_SPACES_REGION || 'ams3';
const endpoint = `https://${doRegion}.digitaloceanspaces.com`;

@Global()
@Module({
  providers: [
    {
      provide: 'S3_CLIENT',
      useFactory: () => {
        return new AWS.S3({
          endpoint,
          region: 'us-east-1',
          credentials: {
            accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
            secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
          },
          s3ForcePathStyle: false,
        });
      },
    },
    S3Service,
  ],
  exports: [S3Service, 'S3_CLIENT'],
})
export class S3Module {}
