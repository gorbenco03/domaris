import { Injectable, Logger } from '@nestjs/common';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface UploadFromUrlOptions {
  prefix?: string; // ex: "listings/facebook/123456"
  contentType?: string; // ex: "image/jpeg"
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;
  private readonly bucket: string;

  constructor() {
    this.s3 = new AWS.S3({ region: 'eu-central-1' });
    this.bucket = process.env.AWS_S3_BUCKET || '';

    if (!this.bucket) {
      this.logger.error('AWS_S3_BUCKET nu este setat în environment variables');
      throw new Error('AWS_S3_BUCKET is required');
    }
  }

  /**
   * Upload din fișier local (versiunea ta originală, păstrată)
   */
  async uploadImage(filePath: string, key: string): Promise<string> {
    const file = fs.readFileSync(filePath);

    await this.s3
      .putObject({
        Bucket: this.bucket,
        Key: key,
        Body: file,
        ContentType: 'image/jpeg',
      })
      .promise();

    return key;
  }

  /**
   * Upload direct dintr-un URL (ex: link imagine Facebook) către S3.
   * Îți întoarce URL-ul S3 (sau CloudFront, dacă schimbi domain-ul).
   */
  async uploadFromUrl(
    imageUrl: string,
    options: UploadFromUrlOptions = {}
  ): Promise<string> {
    const { prefix = 'uploads', contentType } = options;

    try {
      // 1. Descarcă imaginea din URL
      const response = await axios.get<ArrayBuffer>(imageUrl, {
        responseType: 'arraybuffer',
      });

      const buffer = Buffer.from(response.data);
      const detectedContentType =
        contentType || response.headers['content-type'] || 'image/jpeg';

      // 2. Generează un key decent
      const ext =
        this.getExtensionFromContentType(detectedContentType) ||
        this.getExtensionFromUrl(imageUrl) ||
        'jpg';
      const fileName = `${uuidv4()}.${ext}`;
      const key = `${prefix.replace(/\/+$/, '')}/${fileName}`;

      // 3. Upload în S3
      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: detectedContentType,
          ACL: 'public-read', // doar dacă vrei să fie accesibile public
        })
        .promise();

      // 4. Construiește URL-ul public (simplu, poți schimba cu CloudFront)
      const url = `https://${this.bucket}.s3.eu-central-1.amazonaws.com/${key}`;
      return url;
    } catch (error: any) {
      this.logger.error(
        `Failed to upload image from URL (${imageUrl}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  private getExtensionFromContentType(contentType: string): string | null {
    if (!contentType) return null;
    if (contentType.includes('jpeg')) return 'jpg';
    if (contentType.includes('png')) return 'png';
    if (contentType.includes('webp')) return 'webp';
    if (contentType.includes('gif')) return 'gif';
    return null;
  }

  private getExtensionFromUrl(url: string): string | null {
    try {
      const pathname = new URL(url).pathname;
      const match = pathname.match(/\.([a-zA-Z0-9]+)(\?|$)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  }
}
