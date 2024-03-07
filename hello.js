const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://aaronroussel:class123@cluster0.c3oy0fh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const express = require("express");
const path = require("path");
const app = express();
const port = 8000;
const formidable = require("express-formidable");

// Static files
app.use(express.static(__dirname));
app.use(formidable());

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "part_info_form_updated.html"));
});

app.get("/create_account", (req, res) => {
  res.sendFile(path.join(__dirname, "create_account.html"));
});

app.post("/create_account", async (req, res) => {
  console.log("Received Post Request");
  console.log("Form Data:", req.fields);
  const newData = {
    username: req.fields.userName,
    password: req.fields.password,
  };
  try {
    created = await createAccount(client, newData);
    if (!created) {
      res.send("account already exists");
    } else {
      res.send("Account Created");
    }
  } catch (error) {
    console.error("Error inserting Data", error);
    res.status(500).send("Error inserting data");
  }
});

app.get("/say/:name", function (req, res) {
  res.send("Hello " + req.params.name + "!");
});

// Route to access database:
app.get("/api/mongo/:item", function (req, res) {
  const searchKey = "{ partid: '" + req.params.item + "' }";
  console.log("Looking for: " + searchKey);
  async function run() {
    try {
      await client.connect();
      const database = client.db("arousmdb");
      const parts = database.collection("Tools");

      // Hardwired Query for a part that has partID '12345'
      // const query = { partID: '12345' };
      // But we will use the parameter provided with the route
      const query = { partid: req.params.item };

      const part = await parts.findOne(query);
      console.log(part);
      res.send("Found this: " + JSON.stringify(part)); //Use stringify to print a json
    } finally {
      // Ensures that the client will close when you finish/error
      await client.close();
    }
  }
  run().catch(console.dir);
});

app.post("/", async (req, res) => {
  console.log("Received Post Request");
  console.log("Form Data:", req.fields);
  const newData = {
    part: req.fields.partName,
    price: req.fields.price,
    descr: req.fields.description,
    partid: req.fields.partid,
  };
  try {
    await insertListing(client, newData);
    res.send("Form Data Received and inserted");
  } catch (error) {
    console.error("Error inserting Data", error);
    res.status(500).send("Error inserting data");
  }
});

app.get("/tools", async (req, res) => {
  console.log("initiating GET request from mongodb");
  try {
    await client.connect();
    const collection = client.db("arousmdb").collection("Tools");
    const tools = await collection.find({}).toArray();
    console.log(tools);
    res.json(tools);
  } catch (error) {
    console.error("Error fetching tools", error);
    res.status(500).send("Error fetching data");
  } finally {
    await client.close();
  }
});

app.get("/tools-page", (req, res) => {
  res.sendFile(path.join(__dirname, "tools.html"));
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

async function insertListing(client, newListing) {
  console.log("POST data: ", newListing);
  try {
    await client.connect();
    const result = await client
      .db("arousmdb")
      .collection("Tools")
      .insertOne(newListing);
    console.log(
      "New listing created with the following id: ${result.insertedId}",
    );
  } finally {
    await client.close();
  }
}

async function createAccount(client, newAccount) {
  console.log("POST data: ", newAccount);
  wasCreated = false;
  const query = { username: newAccount.username };
  try {
    await client.connect();
    const result_accounts = await client
      .db("arousmdb")
      .collection("Accounts")
      .findOne(query);
    //await client.close();
    if (result_accounts == null) {
      // client.connect();
      const result = await client
        .db("arousmdb")
        .collection("Accounts")
        .insertOne(newAccount);
      console.log(
        "New account created with the following id: ${result.insertedId}",
      );
      wasCreated = true;
    } else {
      console.log("Account already exists");
    }
  } finally {
    await client.close();
  }

  return wasCreated;
}
