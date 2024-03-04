const { MongoClient } = require("mongodb");
const uri =
  "mongodb+srv://aaronroussel:class123@cluster0.c3oy0fh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const express = require("express");
const path = require("path");
const app = express();
const port = 8080;
const formidable = require("express-formidable");

// Static files
app.use(express.static(__dirname));
app.use(formidable());

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "part_info_form_updated.html"));
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
