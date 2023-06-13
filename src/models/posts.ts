import mongoose from 'mongoose';
import type { IPostsSchemaType } from '../types/posts.type';

const { Schema } = mongoose;

const PostsSchema = new Schema<IPostsSchemaType>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
  updatedAt: { type: Date, default: null },
  images: [
    {
      filename: { type: String, required: true },
      imageUrl: { type: String, required: true },
    },
  ],
  user: {
    _id: { type: mongoose.Types.ObjectId, required: true, ref: 'User' },
    nickname: { type: String, required: true },
  },
});

const Posts = mongoose.model('Posts', PostsSchema);

export default Posts;
