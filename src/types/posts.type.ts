import type { ObjectId } from 'mongoose';

// TODO: 이미지를 S3에 업로드하고나서 mongoDB에 저장할 타입정의해야됨
export interface IImageFileType {
  filename: string;
  imageUrl: string;
}
export interface IPostsSchemaType {
  title: string;
  body: string;
  createdAt: Date;
  images: IImageFileType[];
  updatedAt: Date | null;
  user: {
    _id: ObjectId;
    nickname: string;
  };
}
