require("dotenv").config();
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");

const port = process.env.PORT || 9000;
const app = express();

// middleware;
const corsOptions = {
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true,
  optionSuccessStatus: 200,
};

// app.use(cookieParser());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(morgan("dev"));

const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      console.log(err);
      return res.status(401).send({ message: "unauthorized access" });
    }
    req.user = decoded;
    next();
  });
};

const uri = `mongodb+srv://${process.env.DB_NAEM}:${process.env.DB_PASS}@cluster0.e4qpy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
async function run() {
  const userCollections = client.db("planteNet-sessio").collection("users");
  const plantCollections = client.db("planteNet-sessio").collection("plants");
  const ordertCollections = client.db("planteNet-sessio").collection("orders");

  try {
    // Generate jwt token
    app.post("/jwt", async (req, res) => {
      const email = req.body;
      const token = jwt.sign(email, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "365d",
      });
      res
        .cookie("token", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        })
        .send({ success: true });
    });

    // Logout
    app.get("/logout", async (req, res) => {
      try {
        res
          .clearCookie("token", {
            maxAge: 0,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          })
          .send({ success: true });
      } catch (err) {
        res.status(500).send(err);
      }
    });

    // save or update user in db
    app.post("/users/:email", async (req, res) => {
      const user = req.body;
      const email = req.params.email;
      // check the user already
      const query = { email };
      const isExist = await userCollections.findOne(query);
      if (isExist) {
        return res.send(isExist);
      }

      const result = await userCollections.insertOne({
        ...user,
        role: "customer",
        timeStemp: Date.now(),
      });
      res.send(result);
    });

    // save plant data in db
    app.post("/plants", verifyToken, async (req, res) => {
      const plant = req.body;
      const result = await plantCollections.insertOne(plant);
      res.send(result);
    });

    // get plant data in db
    app.get("/plants", async (req, res) => {
      const result = await plantCollections.find().toArray();
      res.send(result);
    });

    // get plant data by id form db
    app.get("/plant/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await plantCollections.findOne(query);
      res.send(result);
    });

    // post purchase info in db
    app.post("/orders", verifyToken, async (req, res) => {
      const purchase = req.body;
      const result = await ordertCollections.insertOne(purchase);
      res.send(result);
    });

    // Manage plant quantity
    app.patch("/plants/quantity/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const { quantityToUpdate, status } = req.body;
      const filter = { _id: new ObjectId(id) };
      let updateDoc = {
        $inc: { quantity: -quantityToUpdate },
      };
      if (status === "increase") {
        updateDoc = {
          $inc: { quantity: quantityToUpdate },
        };
      }
      const result = await plantCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get order Collection in db
    app.get("/orders/:email", verifyToken, async (req, res) => {
      const email = req.params.email;
      const query = { "customer.email": email };
      const result = await ordertCollections
        .aggregate([
          {
            $match: query,
          },
          {
            $addFields: {
              plantId: { $toObjectId: "$plantId" },
            },
          },
          {
            $lookup: {
              from: "plants",
              localField: "plantId",
              foreignField: "_id",
              as: "plants",
            },
          },
          { $unwind: "$plants" },
          {
            $addFields: {
              name: "$plants.name",
              category: "$plants.category",
              image: "$plants.image",
            },
          },
          {
            $project: {
              plants: 0,
            },
          },
        ])
        .toArray();

      // const result = await ordertCollections.find(query).toArray();
      console.log("result", result);
      res.send(result);
    });

    // delete order from db by a specific id by user
    app.delete("/orders/:id", verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      
      // if status delivered you can't delete order
      const order = await ordertCollections.findOne(query);
      if (order?.status === "delivered") {
        return res.status(409).send("Cannot cancel once product is delivered");
      }
      const result = await ordertCollections.deleteOne(query);
      res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello from plantNet Server..");
});

app.listen(port, () => {
  console.log(`plantNet is running on port ${port}`);
});
