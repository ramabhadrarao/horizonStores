import mongoose from 'mongoose';

/**
 * Connect to MongoDB
 */
export async function connectToMongoDB(): Promise<typeof mongoose> {
  try {
    const MONGO_URI =
      import.meta.env.VITE_MONGODB_URI ||
      'mongodb://127.0.0.1:27017/horizon_stores?replicaSet=rs0';

    console.log('Connecting to MongoDB...');

    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 30000, // optional timeout
    });

    console.log('✅ MongoDB connected successfully');
    return mongoose;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Export the mongoose instance
export default mongoose;