const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const cors = require('cors');
const cookieParser = require('cookie-parser')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

require("dotenv").config();
app.use(cors({
    origin: ['http://localhost:5173'],
    credentials: true
}))
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));

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
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

const verify = async (req, res, next) => {
    //check if the user is authenticated by checking the request if it has token then it will be verified
    const token = req.cookies?.token;
    if (!token) {
        return res.status(401).send({ status: "Unauthorized", code: 401 });
        // send({ status: "Unauthorized", code: 401 });
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (error, decode) => {
        if (error) {
            return res.status(401).send({ status: "Unauthorized", code: 401 });
        }
        else {
            // console.log(decode);
            req.decode = decode;
            next();
        }

    })
}

// jwt
app.post('/jwt', async (req, res) => {
    const userEmail = req.body;
    //jwt.sign("payload","secretKey","ExpireInfo");
    const token = jwt.sign(userEmail, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' });
    res.cookie("token", token, { httpOnly: true, sameSite: 'none', secure: true, }).send({ message: "success", token })
})

// clear cookies
app.get('/clear', async (req, res) => {
    res.clearCookie('token', {
        maxAge: 0,
        sameSite: 'none',
        secure: true,
    }).send({ message: "success" })
})

// Database collections
const sliderCollection = client.db('eventDb').collection('slider');
const eventCollection = client.db('eventDb').collection('events');
const blogCollection = client.db('eventDb').collection('blogs');
const orderCollection = client.db('eventDb').collection('orders');
const userCollection = client.db('eventDb').collection('users');

// api for sliders
app.get('/slider', async (req, res) => {
    try {
        const cursor = sliderCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    } catch (err) {
        console.log(err);
    }
})

// event related apis
app.get('/event', async (req, res) => {
    try {
        const query = {}
        const option = {
            projection: { _id: 1, name: 1, image: 1, short_description: 1, price: 1 }
        }
        const cursor = eventCollection.find(query, option);
        const result = await cursor.toArray();

        res.send(result);
    }
    catch (err) {
        console.log(err);
    }
})

app.get('/event/:eventId', verify, async (req, res) => {
    console.log(req.decode);
    try {
        const id = req.params.eventId;
        const filter = { _id: new ObjectId(id) }
        const result = await eventCollection.findOne(filter);
        res.send(result);
    } catch (err) { console.log(err); }
})

app.post('/event', verify, async (req, res) => {
    try {
        const newEvent = req.body;
        const result = await eventCollection.insertOne(newEvent);
        res.send(result);
    }
    catch (err) {
        console.log(err);
        res.send(err)
    }
})

app.delete('/event/:eventId', verify, async (req, res) => {
    try {
        const filter = { _id: new ObjectId(req.params.eventId) }
        const result = await eventCollection.deleteOne(filter);
        res.send(result)
    } catch (error) {
        console.log(error);

    }
})

app.put('/event/:eventId', verify, async (req, res) => {
    try {
        const event = req.body;
        const updatedEvent = {
            $set: {
                ...event
            }
        }
        const filter = { _id: new ObjectId(req.params.eventId) }
        const options = { upsert: true }
        // console.log(updatedEvent);
        // res.send({ updatedEvent, filter })
        const result = await eventCollection.updateOne(filter, updatedEvent, options);
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})


//blog related apis

app.get('/blog', async (req, res) => {
    try {
        const cursor = blogCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    } catch (err) { console.log(err); }
})

app.get('/blog/:blogId', verify, async (req, res) => {
    try {
        const id = req.params.blogId;
        const filter = { _id: new ObjectId(id) }
        const result = await blogCollection.findOne(filter);
        res.send(result);
    } catch (error) {
        console.log(error);
    }
})


app.post('/order', verify, async (req, res) => {
    try {
        const bookingDetails = req.body;
        const result = await orderCollection.insertOne(bookingDetails)
        res.send(result)
    } catch (error) {
        console.log(error);
    }
})

// #TODO: api for get the user
app.get('/user/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const result = await userCollection.findOne({ email })
        res.send(result);
    } catch (error) {

    }
})

app.patch('/user/:email', async (req, res) => {
    try {
        const email = req.params.email;
        const user = req.body;
        const filter = { email };
        const option = { upsert: true }
        const updatedUser = {
            $set: {
                ...user,
            }
        }
        const result = await userCollection.updateOne(filter, updatedUser, option)
        res.send(result)
    } catch (error) {
        res.status(500).send({ message: error.message })
    }
})

// app.patch('/user', verify, async (req, res) => {
//     try {
//         const user = req.body;
//         const { email } = user;
//         const query = { email };
//         const updatedUser = {
//             $set: {
//                 ...user,
//             }
//         }
//         const result = await userCollection.updateOne(query, updatedUser)
//         // console.log(user);
//         // console.log(email);
//         res.send(result);
//     } catch (error) {
//         res.send({ error: error })
//     }
// })





app.get('/', verify, (req, res) => {
    res.send("Welcome to my events server!!")
})


app.listen(port, () => {
    console.log("Listening on port ", port);
})