const express = require('express');
const app = express();
const port = process.env.PORT || 5000 ;
require('dotenv').config();
const cors = require('cors');
app.use(cors());
const admin = require("firebase-admin");
app.use(express.json());
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

//admin


var serviceAccount = require("./privateKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
  //databaseURL: "https://kitchenking-website-default-rtdb.firebaseio.com"
});





app.get('/',(req,res)=>{
    res.send('connected');
})

//database connection
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.luxos.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function verifyToken(req, res, next){
  if(req.headers?.authorization?.startsWith('Bearer')){
    const token = req.headers.authorization.split(' ')[1];
    
    try{
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    }
    catch{

    }
  }
  next();
}

async function run() {
  try {
    await client.connect();

    const database = client.db("kitchenKing");
    const productCollection = database.collection("productCollection");
    const orderCollection = database.collection("orderCollection");
    const reviewCollection = database.collection("reviewCollection");
    const userCollection = database.collection("userCollection");
    
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
  //delete an order
  app.delete('/order/delete/:id', async (req,res)=>{
    const id= req.params.id; 
    console.log(id);
    const query = {_id : ObjectId(id)};
    const result = await orderCollection.deleteOne(query);
    console.log('delete hit')
    res.send(result)
    console.log(result)
    })
    /////update an order status approve
     app.put('/order/approve/:id', async (req,res)=>{
       const id = req.params.id ;
       const updatedOrder = req.body;
       console.log(updatedOrder);
       const filter = {_id : ObjectId(id)}
       const options ={upsert : true};
       const updateDoc ={
         $set:{
           status : updatedOrder.status
         }
       };
       const result = await orderCollection.updateOne(filter, updateDoc, options);
       console.log(result);
       res.send(result);
     })

    //get api for specific users order
    app.get('/myorder/:id', async (req,res)=>{
      const id = req.params.id ;
      console.log(id);
      const query= {email : id}
      const result = await orderCollection.find(query).toArray();
      //console.log(result)
      res.send(result)
    })


    //review//////////////////////
    //get review
    app.get('/reviews',async (req,res)=>{
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
      console.log('get success')
  })

    //post review
    app.post('/review', async (req,res)=>{
      console.log(req.body);
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      console.log(result);
      res.send(result);
  })

  

    //Get api for top products
    app.get('/products/topitem', async (req,res)=>{
        console.log('hitted')
        const cursor = productCollection.find({})
        const products = await cursor.limit(6).toArray();
        res.send(products)
    })
      //Get api for all products
      app.get('/products', async (req,res)=>{
        console.log('hitted')
        const cursor = productCollection.find({})
        const products = await cursor.toArray();
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
     //////////////////////////user section
     //new user
     app.post('/users', async (req,res)=>{
       const user = req.body;
       console.log(user)
       const result= await userCollection.insertOne(user);
       console.log(result);
       res.json(result);
     })

     app.put('/users', async (req,res)=>{
       const user = req.body;
       console.log(user)
       const filter = {email: user.email};
       const options={upsert:true};
       const updateDoc = {
         $set:user
       };

       const result= await userCollection.updateOne(filter,updateDoc,options);
       console.log(result);
       res.json(result)
     });


     //make admin
     app.put('/makeAdmin',verifyToken , async (req,res)=>{
       const user= req.body;
       //console.log(req.headers.authorization.split(' ')[1]);  
       console.log('decoded:',req.decodedEmail)

       const requesterEmail = req.decodedEmail;
       if(requesterEmail){
         const requesterAccout = await userCollection.findOne({email:requesterEmail})
         if(requesterAccout.role === 'admin'){
          const filter = {email:user.email};
          const updateDoc = {
            $set : {
              role:'admin'
            }
          }
          const result = await userCollection.updateOne(filter, updateDoc);
          console.log(result)
          res.json(result)
         }
       }
       res.status(403).json({message:'You do not have access'})

       

     })
     //verify user 
     app.get('/users/verify/:email', async(req,res)=>{
       const email = req.params.email;
       const query = {email: email }
       const user = await userCollection.findOne(query);
       let isAdmin = false;
        if(user?.role === 'admin'){
          isAdmin = true;
        }
        res.json({admin: isAdmin});
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

