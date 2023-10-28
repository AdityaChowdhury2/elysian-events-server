const express = require('express');
const app = express();
const cors = require('cors');
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(express.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.MONGODB_USER_NAME}:${process.env.MONGODB_USER_PASS}@cluster0.slh2c1n.mongodb.net/?retryWrites=true&w=majority`;

const port = process.env.PORT || 5000;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");

        const sliderCollection = client.db('eventDb').collection('slider');
        const eventCollection = client.db('eventDb').collection('events');
        const blogCollection = client.db('eventDb').collection('blogs');
        const orderCollection = client.db('eventDb').collection('orders');

        app.get('/slider', async (req, res) => {
            const cursor = sliderCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/event', async (req, res) => {
            const cursor = eventCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/event/:eventId', async (req, res) => {
            const id = req.params.eventId;
            const filter = { _id: new ObjectId(id) }
            const result = await eventCollection.findOne(filter);
            res.send(result);
        })

        app.get('/blog', async (req, res) => {
            const cursor = blogCollection.find();
            const result = await cursor.toArray();
            res.send(result);
        })

        app.get('/blog/:blogId', async (req, res) => {
            const id = req.params.blogId;
            const filter = { _id: new ObjectId(id) }
            const result = await blogCollection.findOne(filter);
            res.send(result);
        })


        app.post('/order', async (req, res) => {
            const bookingDetails = req.body;
            const result = await orderCollection.insertOne(bookingDetails)
            res.send(result)
        })


    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send("Welcome to my events server!!")
})


app.listen(port, () => {
    console.log("Listening on port ", port);
})