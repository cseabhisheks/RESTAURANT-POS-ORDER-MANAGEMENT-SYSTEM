import mongoose from 'mongoose';

export async function connectDB(uri) {
  if (!uri) {
    throw new Error('MONGODB_URI is required to connect to MongoDB.');
  }
  await mongoose.connect(uri);
  return mongoose.connection;
}

