const mongoose = require('mongoose');

// MongoDB connection URI (with fallback)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://pankaj12:MM3d6FobKTaZ8pWs@cluster0.yvs1pu5.mongodb.net/VC';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;