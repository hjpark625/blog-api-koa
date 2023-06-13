import Koa from 'koa';
import Router from 'koa-router';
import koaBody from 'koa-body';
import cors from '@koa/cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import api from './api';

dotenv.config();

const PORT = Number(process.env.PORT) || 4000;
const { MONGO_URI } = process.env;

mongoose
  .connect(`${MONGO_URI}`)
  .then(() => {
    console.info('DB 연결 완료!');
  })
  .catch((e) => {
    console.error(e);
  });

const app = new Koa();
const router = new Router();

router.use('', api.routes());

app.use(cors({ credentials: true }));
app.use(koaBody({ multipart: true, formidable: { maxFileSize: 5 * 1024 * 1024 } }));
app.use(router.routes()).use(router.allowedMethods());

app.listen(PORT, () => {
  console.info(`${PORT}번 포트에서 서비스 대기중`);
});
