import type { Model, HydratedDocument, ObjectId } from 'mongoose';
import type { JwtPayload } from 'jsonwebtoken';

export interface IUserSchemaType {
  email: string;
  nickname: string;
  hashedPassword: string;
  password?: string;
  registeredAt: Date;
  updatedAt: Date;
  refreshToken?: string;
}

export interface IUserInstanceType extends IUserSchemaType {
  setPassword: (password: string) => Promise<void>;
  checkPassword: (password: string) => Promise<boolean>;
  serialize: () => IUserSchemaType;
  generateAccessToken: () => string;
  generateRefreshToken: () => string;
  saveRefreshToken: (refreshToken: string) => Promise<void>;
}

export interface IUserModelType extends Model<IUserSchemaType, object, IUserInstanceType> {
  findByUserEmail: (email: string) => Promise<HydratedDocument<IUserSchemaType, IUserInstanceType>>;
}

export interface IUserInfoType {
  email: string;
  nickname: string | null;
  password: string;
}

export interface IDecodedTokenInfo extends JwtPayload {
  _id: ObjectId;
  email: string;
  nickname: string;
}
