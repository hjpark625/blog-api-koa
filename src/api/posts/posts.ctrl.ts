import { Error } from 'mongoose';
import jwt from 'jsonwebtoken';
import Posts from '../../models/posts';
import type { Context } from 'koa';
import type { ObjectId } from 'mongoose';
import type { IPostsSchemaType } from '../../types/posts.type';
import type { IDecodedTokenInfo } from '../../types/auth.type';

export const getPosts = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    } else jwt.verify(accessToken, `${process.env.JWT_SECRET}`);

    const { page, limit } = ctx.query;

    const posts = await Posts.find()
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean()
      .exec();

    const postCount = await Posts.countDocuments().exec();
    ctx.set('Last-Page', Math.ceil(postCount / Number(limit)).toString());
    ctx.body = {
      data: posts.map((post) => ({
        ...post,
        title: post.title.normalize(),
        body: post.body.normalize().length < 200 ? post.body.normalize() : `${post.body.normalize().slice(0, 200)}...`,
      })),
      totalCount: postCount,
    };
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};

export const createPost = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    } else {
      const decoded = jwt.verify(accessToken, `${process.env.JWT_SECRET}`) as IDecodedTokenInfo;
      const { title, body, images } = ctx.request.body as IPostsSchemaType;
      if (!title || !body) {
        ctx.status = 400;
        ctx.body = {
          message: '제목 또는 내용이 없습니다.',
        };
        return;
      }
      const post = new Posts({
        title,
        body,
        images: images ? images : [],
        user: {
          _id: decoded._id,
          nickname: decoded.nickname,
        },
      });
      await post.save();
      ctx.status = 201;
      ctx.body = post;
      return;
    }
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};

export const getPostById = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    } else {
      jwt.verify(accessToken, `${process.env.JWT_SECRET}`);
      const { postId } = ctx.params as { postId: ObjectId };
      const post = await Posts.findById(postId).exec();
      if (!post) {
        ctx.status = 404;
        ctx.body = {
          message: '포스트가 존재하지 않습니다.',
        };
        return;
      }
      ctx.body = post;
      return;
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else if (err as Error.CastError) {
      ctx.status = 400;
      ctx.body = {
        message: '정확한 포스트 아이디가 아닙니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};

export const deletePostById = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    }
    jwt.verify(accessToken, `${process.env.JWT_SECRET}`);
    const { postId } = ctx.params as { postId: ObjectId };
    await Posts.findByIdAndDelete(postId).exec();
    ctx.status = 204;
    return;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else if (err instanceof Error.CastError) {
      ctx.status = 400;
      ctx.body = {
        message: '정확한 포스트 아이디가 아닙니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};

export const updatePost = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    }
    jwt.verify(accessToken, `${process.env.JWT_SECRET}`);
    const { postId } = ctx.params as { postId: ObjectId };
    const { title, body, images } = ctx.request.body as IPostsSchemaType;
    if (!title && !body && !images) {
      ctx.status = 400;
      ctx.body = {
        message: '수정할 내용이 없습니다.',
      };
      return;
    }
    const post = await Posts.findByIdAndUpdate(postId, { title, body, images, updatedAt: Date.now() }).exec();
    if (!post) {
      ctx.status = 404;
      ctx.body = {
        message: '포스트가 존재하지 않습니다.',
      };
      return;
    }
    const updatedPost = await Posts.findById(postId).exec();
    ctx.status = 200;
    ctx.body = updatedPost;
    return;
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else if (err instanceof Error.CastError) {
      ctx.status = 400;
      ctx.body = {
        message: '정확한 포스트 아이디가 아닙니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};

export const getPostsByUserId = async (ctx: Context) => {
  try {
    const authorization = ctx.header.authorization;
    const accessToken = authorization?.split(' ')[1];
    if (authorization == null || accessToken == null || authorization.split(' ')[0] !== 'Bearer') {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
      };
      return;
    }
    if (accessToken == null) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 존재하지 않습니다.',
      };
      return;
    }
    const decoded = jwt.verify(accessToken, `${process.env.JWT_SECRET}`) as IDecodedTokenInfo;
    const { userId } = ctx.params as { userId: ObjectId };
    if (decoded._id !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: '아이디가 일치하지 않습니다.',
      };
      return;
    }
    const posts = await Posts.find({ 'user._id': userId }).sort({ createdAt: -1 }).exec();
    const postCount = await Posts.countDocuments().exec();
    ctx.status = 200;
    ctx.body = {
      data: posts,
      totalCount: postCount,
    };
    return;
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 만료되었습니다.',
      };
      return;
    } else if (err instanceof Error.CastError) {
      ctx.status = 404;
      ctx.body = {
        message: '존재하지 않는 유저입니다.',
      };
      return;
    } else {
      return ctx.throw(`${err}`, 500);
    }
  }
};
