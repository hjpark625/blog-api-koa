import Router from 'koa-router';
import * as postsCtrl from './posts.ctrl';

const posts = new Router();

posts.get('/', postsCtrl.getPosts);
posts.get('/user/:userId', postsCtrl.getPostsByUserId);
posts.post('/', postsCtrl.createPost);
posts.delete('/:postId', postsCtrl.deletePostById);
posts.get('/:postId', postsCtrl.getPostById);
posts.patch('/:postId', postsCtrl.updatePost);

export default posts;
