import { Injectable } from '@nestjs/common';
import AWS from 'aws-sdk';
import * as fs from 'fs';

@Injectable()
export class S3Service {
  private s3 = new AWS.S3({ region: 'eu-central-1' });

  async uploadImage(filePath: string, key: string)  {
    const file = fs.readFileSync(filePath);
    await this.s3.putObject({ Bucket: process.env.AWS_S3_BUCKET, Key: key, Body: file, ContentType: 'image/jpeg' }).promise();

    return key;
  }
}
