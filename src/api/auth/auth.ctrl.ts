import jwt from 'jsonwebtoken';
import User from '../../models/user';
import type { Context } from 'koa';
import type { IDecodedTokenInfo, IUserInfoType } from '../../types/auth.type';

export const register = async (ctx: Context) => {
  const { email, nickname, password } = ctx.request.body as IUserInfoType;

  try {
    const isNewUser = await User.findByUserEmail(email);
    if (isNewUser) {
      ctx.status = 409;
      ctx.body = {
        message: '이미 존재하는 유저입니다.',
      };
      return;
    }

    const user = new User({
      email,
      nickname: nickname ?? email.split('@')[0],
      registeredAt: new Date(),
      updatedAt: null,
      refreshToken: null,
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    await user.setPassword(password);
    await user.save();
    await user.saveRefreshToken(refreshToken);

    const data = user.toJSON();

    delete data.password;

    ctx.status = 201;
    ctx.body = {
      user: {
        info: user.serialize(),
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
    return;
  } catch (err) {
    ctx.throw(`${err}`, 500);
  }
};

export const login = async (ctx: Context) => {
  const { email, password } = ctx.request.body as IUserInfoType;
  if (!email || !password) {
    ctx.status = 401;
    ctx.body = {
      message: '이메일과 비밀번호를 입력해주세요.',
    };
    return;
  }

  try {
    const user = await User.findByUserEmail(email);
    if (!user) {
      ctx.status = 401;
      ctx.body = {
        message: '존재하지 않는 유저입니다.',
      };
      return;
    }
    const isValidPassword = await user.checkPassword(password);
    if (!isValidPassword) {
      ctx.status = 401;
      ctx.body = {
        message: '비밀번호가 일치하지 않습니다.',
      };
      return;
    }
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    await User.findByIdAndUpdate(user._id, { refreshToken });

    ctx.body = {
      user: {
        info: user.serialize(),
        access_token: accessToken,
        refresh_token: refreshToken,
      },
    };
  } catch (err) {
    ctx.throw(`${err}`, 500);
  }
};

export const logout = async (ctx: Context) => {
  if (
    ctx.header.authorization == null ||
    ctx.header.authorization.split(' ')[1] == null ||
    ctx.header.authorization.split(' ')[0] !== 'Bearer'
  ) {
    ctx.status = 401;
    ctx.body = {
      message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
    };
    return;
  }
  const refreshToken = ctx.header.authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(refreshToken, `${process.env.JWT_SECRET}`) as IDecodedTokenInfo;
    const user = await User.findById({ _id });

    if ((user && user.refreshToken) !== refreshToken) {
      ctx.status = 401;
      ctx.body = {
        message: '토큰이 일치하지 않거나 잘못된 토큰입니다.',
      };
      return;
    }

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: '존재하지 않는 유저입니다.',
      };
      return;
    } else {
      user.refreshToken = '';
      user.save();
      ctx.status = 204;
      return;
    }
  } catch (err) {
    ctx.throw(`${err}`, 500);
  }
};

export const reissueToken = async (ctx: Context) => {
  if (
    ctx.header.authorization == null ||
    ctx.header.authorization.split(' ')[1] == null ||
    ctx.header.authorization.split(' ')[0] !== 'Bearer'
  ) {
    ctx.status = 401;
    ctx.body = {
      message: '토큰이 존재하지 않거나 잘못된 방식의 토큰입니다.',
    };
    return;
  }
  const resfreshToken = ctx.header.authorization.split(' ')[1];

  try {
    const { _id } = jwt.verify(resfreshToken, `${process.env.JWT_SECRET}`) as IDecodedTokenInfo;
    const user = await User.findById({ _id });

    if (user && user.refreshToken === resfreshToken) {
      const accessToken = user.generateAccessToken();
      ctx.status = 200;
      ctx.body = {
        access_token: accessToken,
      };
      return;
    }
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError) {
      ctx.status = 400;
      ctx.body = {
        message: '토큰이 일치하지 않거나 잘못된 토큰입니다.',
      };
    } else {
      ctx.throw(`${err}`, 500);
    }
  }
};
