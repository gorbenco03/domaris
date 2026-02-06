import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import AWS from 'aws-sdk';
import * as fs from 'fs';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

interface UploadFromUrlOptions {
  prefix?: string; // ex: "listings/facebook/123456"
  contentType?: string; // ex: "image/jpeg"
}

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly region: string;

  constructor() {
    // Actual DO region (ams3, nyc3, sfo3…) – used for endpoint and public URLs
    this.region = process.env.DO_SPACES_REGION || 'ams3';
    this.bucket = process.env.DO_SPACES_BUCKET || '';
    const endpoint = `https://${this.region}.digitaloceanspaces.com`;

    // DigitalOcean docs: use region 'us-east-1' in SDK config; real region comes from endpoint
    this.s3 = new AWS.S3({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID!,
        secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY!,
      },
      s3ForcePathStyle: false,
    });

    if (!this.bucket) {
      this.logger.error('DO_SPACES_BUCKET nu este setat în environment variables');
      throw new Error('DO_SPACES_BUCKET is required');
    }
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.s3.headBucket({ Bucket: this.bucket }).promise();
      this.logger.log(
        `Spaces OK: bucket "${this.bucket}" (${this.region}) – conexiune verificată`,
      );
    } catch (err: any) {
      const code = err?.code ?? err?.statusCode ?? 'unknown';
      const msg = err?.message ?? String(err);
      const hint =
        code === 'Forbidden' || err?.statusCode === 403
          ? ' Folosești chei Spaces (API → Spaces Keys), nu API Token. Verifică DO_SPACES_ACCESS_KEY_ID și DO_SPACES_SECRET_ACCESS_KEY.'
          : '';
      this.logger.warn(
        `Spaces: nu s-a putut verifica bucket-ul "${this.bucket}" (${this.region}). ` +
          `Eroare: ${code} – ${msg}${hint}`,
      );
    }
  }

  /**
   * Returnează URL-ul public pentru un key din DigitalOcean Spaces.
   */
  getPublicUrl(key: string): string {
    return `https://${this.bucket}.${this.region}.digitaloceanspaces.com/${key}`;
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
        ACL: 'public-read',
      })
      .promise();

    return key;
  }

  /**
   * Upload direct dintr-un URL (ex: link imagine Facebook) către DigitalOcean Spaces.
   * Îți întoarce URL-ul public Spaces.
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

      // 3. Upload în Spaces
      await this.s3
        .putObject({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: detectedContentType,
          ACL: 'public-read',
        })
        .promise();

      return this.getPublicUrl(key);
    } catch (error: any) {
      this.logger.error(
        `Failed to upload image from URL (${imageUrl}): ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Make all objects under a prefix publicly readable.
   * Used to fix existing private uploads.
   */
  async makeAllPublic(prefix: string = 'listings/'): Promise<number> {
    let updated = 0;
    let continuationToken: string | undefined;

    do {
      const listParams: AWS.S3.ListObjectsV2Request = {
        Bucket: this.bucket,
        Prefix: prefix,
        MaxKeys: 100,
        ContinuationToken: continuationToken,
      };

      const listResult = await this.s3.listObjectsV2(listParams).promise();

      for (const obj of listResult.Contents || []) {
        if (!obj.Key) continue;
        try {
          await this.s3
            .putObjectAcl({
              Bucket: this.bucket,
              Key: obj.Key,
              ACL: 'public-read',
            })
            .promise();
          updated++;
          this.logger.log(`Made public: ${obj.Key}`);
        } catch (err: any) {
          this.logger.error(`Failed to make public: ${obj.Key} — ${err.message}`);
        }
      }

      continuationToken = listResult.IsTruncated
        ? listResult.NextContinuationToken
        : undefined;
    } while (continuationToken);

    this.logger.log(`Made ${updated} objects public under prefix "${prefix}"`);
    return updated;
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
