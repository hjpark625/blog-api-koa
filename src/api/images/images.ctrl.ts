import jwt from 'jsonwebtoken';
import fs from 'fs';
import AWSStorage from '../../lib/aws-s3';
import type { Context } from 'koa';
import type { PutObjectRequest, ManagedUpload } from 'aws-sdk/clients/s3';

export const uploadImage = async (ctx: Context) => {
  const files = ctx.request.files && ctx.request.files.files;
  const myFiles = Array.isArray(files) ? files : typeof files === 'object' ? [files] : null;

  const authorization = ctx.header.authorization;
  const accessToken = authorization?.split(' ')[1];
  if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
    ctx.status = 401;
    ctx.body = {
      message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
    };
    return;
  } else jwt.verify(accessToken, `${process.env.JWT_SECRET}`);

  if (myFiles) {
    try {
      const filePromises = myFiles.map((file) => {
        const { filepath, originalFilename, mimetype } = file;
        const body = fs.createReadStream(filepath);

        const params = {
          Bucket: 'frontyardposts',
          Key: `images/${originalFilename ?? ''}`,
          Body: body,
          ContentType: mimetype ?? '',
        } satisfies PutObjectRequest;

        return new Promise<ManagedUpload.SendData>((resolve, reject) => {
          AWSStorage.upload(params, (error: Error, data: ManagedUpload.SendData) => {
            if (error) {
              reject(error);
              return;
            }
            resolve(data);
            return;
          });
        });
      });
      const results = await Promise.all(filePromises);
      ctx.status = 200;
      ctx.body = results.map((result) => ({ name: result.Key.split('/')[1], location: result.Location }));
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        ctx.status = 401;
        ctx.body = {
          message: '토큰이 만료되었습니다.',
        };
        return;
      }
      ctx.throw(`${err}`, 500);
    }
  } else {
    ctx.status = 400;
    ctx.body = {
      message: '이미지가 존재하지 않습니다.',
    };
  }
};
