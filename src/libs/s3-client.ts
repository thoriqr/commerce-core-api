import { DeleteObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { env } from "../config/env";

export const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID,
    secretAccessKey: env.R2_SECRET_ACCESS_KEY
  }
});

const isTest = env.NODE_ENV === "test";

export function uploadFile(fileBuffer: Buffer, imageKey: string, mimetype: string) {
  if (isTest) {
    return Promise.resolve({
      Key: imageKey
    });
  }

  return s3Client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: imageKey,
      Body: fileBuffer,
      ContentType: mimetype
    })
  );
}

export function deleteFile(imageKey: string) {
  if (isTest) {
    return Promise.resolve();
  }

  return s3Client.send(
    new DeleteObjectCommand({
      Bucket: env.R2_BUCKET_NAME,
      Key: imageKey
    })
  );
}
