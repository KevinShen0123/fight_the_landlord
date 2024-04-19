import { MongoClient } from 'mongodb';

// Connection URL
const url = process.env.MONGO_URL || 'mongodb://127.0.0.1:27017';
const client = new MongoClient(url);

async function main() {
    try {
        await client.connect();
        console.log('Connected successfully to MongoDB');

        const db = client.db("fightTheLandlord");
        const usersCollection = db.collection("users");

        const usersData = [
            { preferred_username: "Alice", score: 150, gamesPlayed: 10, gamesWon: 5 },
            { preferred_username: "Bob", score: 200, gamesPlayed: 20, gamesWon: 10 },
            { preferred_username: "Charlie", score: 100, gamesPlayed: 8, gamesWon: 3 }
        ];

       
        for (const user of usersData) {
            const result = await usersCollection.updateOne(
                { preferred_username: user.preferred_username }, 
                {
                    $setOnInsert: {
                        score: user.score,
                        gamesPlayed: user.gamesPlayed,
                        gamesWon: user.gamesWon,
                        totalPlayTime: 0,
                        personalInformation: ""
                    },
                    $set: { lastLogin: new Date() }
                },
                { upsert: true }
            );

            console.log(`Updated or inserted user ${user.preferred_username}: ${result.upsertedId ? "inserted" : "updated"}`);
        }
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    } finally {
        await client.close();
    }
}

main();
