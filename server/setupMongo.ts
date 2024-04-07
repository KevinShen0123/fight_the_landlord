import { MongoClient } from 'mongodb'

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017'
const client = new MongoClient(url)


async function main() {
  await client.connect()
  console.log('Connected successfully to MongoDB')

  const db = client.db("fightTheLandlord")

  await db.collection("users").createIndex(
    { username: 1 }, 
    { unique: true }
);

 

  process.exit(0)
}

main()
