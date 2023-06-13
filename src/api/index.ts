import Router from 'koa-router';
import auth from './auth';
import posts from './posts';
import images from './images';

const api = new Router();

api.use('/auth', auth.routes());
api.use('/posts', posts.routes());
api.use('/files', images.routes());

export default api;
