const express = require('express');
const app = express();
const port = process.env.PORT || 5000 ;
require('dotenv').config();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const { MongoClient } = require('mongodb');

app.get('/',(req,res)=>{
    res.send('connected');
})

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luxos.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
  try {
    await client.connect();

    const database = client.db("kitchenKing");
    const productCollection = database.collection("productCollection");
    // insert product using POST method
    app.post('/products',async (req,res)=>{
        const product = req.body;
        console.log(product);
        const result= await(productCollection.insertOne(product))
        console.log('db send', result)
        res.send(result)
    
    })

    //Get api for products
    app.get('/products/topitem', async (req,res)=>{
        console.log('hitted')
        const cursor = productCollection.find({})
        const products = await cursor.limit(6).toArray();
        res.send(products)
    })
    
    //const result = await haiku.insertOne(doc);

    //console.log(`A document was inserted with the _id: ${result.insertedId}`);
  } finally {
    
  }
}
run().catch(console.dir);

app.listen(port, ()=>{
    console.log('listening from',port);
})

