import Router from 'koa-router';
import * as imagesCtrl from './images.ctrl';

const images = new Router();

images.post('/upload', imagesCtrl.uploadImage);

export default images;
