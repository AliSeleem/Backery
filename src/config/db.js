const mongoose = require('mongoose');

/**
 * Connect to MongoDB with automatic fallback to in-memory database
 * for local development if MongoDB daemon is not running.
 */
const connectDB = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/reef_maadi_bakery';

    // Set connection options
    const options = {
        serverSelectionTimeoutMS: 4000, // Timeout after 4s to allow graceful fallback
    };

    try {
        console.log(`Connecting to MongoDB at: ${mongoUri}...`);
        const conn = await mongoose.connect(mongoUri, options);
        console.log(`MongoDB Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    } catch (primaryError) {
        console.warn(`Could not connect to primary MongoDB at ${mongoUri}. Reason: ${primaryError.message}`);
        
        // In development, try to launch in-memory MongoDB fallback
        try {
            console.log('Attempting to initialize MongoMemoryServer fallback for local execution...');
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const mongod = await MongoMemoryServer.create();
            const memoryUri = mongod.getUri();
            
            const conn = await mongoose.connect(memoryUri);
            console.log(`Fallback in-memory MongoDB Connected: ${memoryUri}`);
            console.log('NOTICE: Running with an in-memory database. All schemas and queries are standard MongoDB.');
            return conn;
        } catch (fallbackError) {
            console.error('CRITICAL: Failed to connect to MongoDB and in-memory fallback could not start.');
            console.error('Fallback error:', fallbackError.message);
            console.error('Please ensure MongoDB is running or specify a valid MONGODB_URI in your .env file.');
            throw primaryError;
        }
    }
};

module.exports = connectDB;
