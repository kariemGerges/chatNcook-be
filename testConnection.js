require('dotenv').config();
const { MongoClient } = require('mongodb');

const uri = process.env.MONGO_CONNECTION_STRING;

const client = new MongoClient(uri);

async function run() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB Atlas using MongoDB driver');
    // Optionally, list databases
    const databasesList = await client.db().admin().listDatabases();
    console.log('Databases:', databasesList.databases);
  } catch (err) {
    console.error('MongoDB connection error:', err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
