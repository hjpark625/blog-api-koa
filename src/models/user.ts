import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { IUserSchemaType, IUserModelType, IUserInstanceType } from '../types/auth.type';

const UserSchema = new Schema<IUserSchemaType, IUserModelType, IUserInstanceType>({
  email: { type: String, required: true },
  nickname: { type: String },
  hashedPassword: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: null },
  refreshToken: { type: String },
});

UserSchema.methods.setPassword = async function (password: string) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  this.hashedPassword = hash;
};

UserSchema.methods.checkPassword = async function (password: string) {
  const result = await bcrypt.compare(password, this.hashedPassword);
  return result;
};

UserSchema.methods.saveRefreshToken = async function (refreshToken: string) {
  this.refreshToken = refreshToken;
  await this.save();
};

UserSchema.statics.findByUserEmail = async function (email: string) {
  return this.findOne({ email });
};

UserSchema.methods.serialize = function () {
  const data = this.toJSON();
  delete data.hashedPassword;
  delete data.refreshToken;
  return data;
};

UserSchema.methods.generateAccessToken = function () {
  const accessToken = jwt.sign(
    {
      _id: this.id as mongoose.ObjectId,
      nickname: this.nickname,
    },
    `${process.env.JWT_SECRET}`,
    { algorithm: 'HS256', expiresIn: '30m' },
  );
  return accessToken;
};

UserSchema.methods.generateRefreshToken = function () {
  const refreshToken = jwt.sign(
    {
      _id: this.id as mongoose.ObjectId,
      nickname: this.nickname,
      email: this.email,
      password: this.hashedPassword,
    },
    `${process.env.JWT_SECRET}`,
    { algorithm: 'HS256', expiresIn: '14d' },
  );
  return refreshToken;
};

const User = mongoose.model<IUserSchemaType, IUserModelType>('User', UserSchema);

export default User;
