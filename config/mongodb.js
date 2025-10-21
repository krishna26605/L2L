import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    // Use a direct connection to avoid SRV record issues
    let connectionString = process.env.MONGODB_URI;
    
    // If using MongoDB Atlas, convert from SRV to standard connection
    if (connectionString && connectionString.includes('mongodb+srv://')) {
      // Replace with direct connection to one of the nodes
      // You'll need to get the actual node URLs from your Atlas cluster
      console.log('Using SRV connection string, this may cause DNS issues...');
    }
    
    // Fallback to local MongoDB if Atlas fails
    if (!connectionString) {
      connectionString = 'mongodb://127.0.0.1:27017/zerowaste';
      console.log('Using local MongoDB fallback');
    }

    console.log('Connecting to MongoDB...');

    const conn = await mongoose.connect(connectionString, {
      // Remove deprecated options - they're causing warnings
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    
    // Suggest fallback options
    if (error.message.includes('ENOTFOUND') || error.message.includes('querySrv')) {
      console.log('\n💡 DNS Resolution Failed. Try these solutions:');
      console.log('1. Check your internet connection');
      console.log('2. Try using Google DNS (8.8.8.8)');
      console.log('3. Use local MongoDB instead');
      console.log('4. Check if MongoDB Atlas cluster is running');
    }
    
    process.exit(1);
  }
};

export { connectDB };










// import mongoose from 'mongoose';

// let isConnected = false;

// export const connectDB = async () => {
//   if (isConnected) {
//     console.log('MongoDB already connected');
//     return;
//   }

//   try {
//     const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/zerowaste-dinemap';
    
//     await mongoose.connect(mongoUri, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true,
//     });

//     isConnected = true;
//     console.log('MongoDB connected successfully');
//   } catch (error) {
//     console.error('MongoDB connection error:', error);
//     process.exit(1);
//   }
// };

// export const disconnectDB = async () => {
//   if (!isConnected) return;
  
//   try {
//     await mongoose.disconnect();
//     isConnected = false;
//     console.log('MongoDB disconnected');
//   } catch (error) {
//     console.error('MongoDB disconnection error:', error);
//   }
// };

// export default mongoose;
