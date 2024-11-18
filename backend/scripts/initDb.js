const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function testConnection() {
    try {
        // Verify that we have a MongoDB URI
        if (!process.env.MONGODB_URI) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        console.log('Attempting to connect to MongoDB...');

        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000
        });

        console.log('✅ MongoDB connection successful');

        // Test creating a collection
        const testCollection = mongoose.connection.collection('test');
        await testCollection.insertOne({ test: true, date: new Date() });
        console.log('✅ Write operation successful');

        // Test reading from collection
        const doc = await testCollection.findOne({ test: true });
        console.log('✅ Read operation successful');

        // Clean up
        await testCollection.drop();
        console.log('✅ Cleanup successful');

        console.log('\n🚀 Database is ready to use!');
    } catch (error) {
        console.error('❌ Database initialization failed:');
        console.error('Error details:', error.message);
        if (error.code) {
            console.error('Error code:', error.code);
        }
        process.exit(1);
    } finally {
        await mongoose.connection.close();
    }
}

testConnection(); 