import { S3 } from 'aws-sdk';
import type { ConfigurationOptions } from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const credentials = {
  accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? '',
  secretAccessKey: process.env.AWS_SECRET_KEY ?? '',
} satisfies ConfigurationOptions['credentials'];

const AWSStorage = new S3({
  credentials,
  region: process.env.AWS_REGION,
});

export default AWSStorage;
