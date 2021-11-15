const express = require('express');
const app = express();
const port = process.env.PORT || 5000 ;
require('dotenv').config();
const cors = require('cors');
app.use(cors());
app.use(express.json());
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
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
    const orderCollection = database.collection("orderCollection")
    // insert product using POST method
    app.post('/products',async (req,res)=>{
        const product = req.body;
        console.log(product);
        const result= await(productCollection.insertOne(product))
        console.log('db send', result)
        res.send(result)
    
    })
    //post 
    ///post for order 
    app.post('/order', async (req,res)=>{
      console.log(req.body);
      const order = req.body;
      const result = await orderCollection.insertOne(order)
      console.log(result);
      res.send(result);
  })
    ///get all orders
    app.get('/order',async(req,res)=>{
      const cursor = orderCollection.find({});
      const order = await cursor.toArray();
      res.send(order);
      console.log('get success')
  })

    //Get api for products
    app.get('/products/topitem', async (req,res)=>{
        console.log('hitted')
        const cursor = productCollection.find({})
        const products = await cursor.limit(6).toArray();
        res.send(products)
    })
    //get single product
    app.get('/purchase/:id', async (req,res)=>{
      const id = req.params.id;
      console.log(id)
      const query = {_id : ObjectId(id)};
      const product = await productCollection.findOne(query);
      res.json(product);
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

