const express = require("express");
const path = require("path");
const app = express();
const port = 8000;
const http = require("http");
const formidable = require("express-formidable");
const DBconnection = require("./Controllers/db_controller");
const client = DBconnection.getInstance().client;
const cookieParser = require("cookie-parser");
const socketIo = require("socket.io");
const server = http.createServer(app);
const io = socketIo(server);

// Static files
app.use(express.static(__dirname));
app.use(formidable());
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  let cookie = req.cookies;
  if (cookie.username) {
    res.sendFile(path.join(__dirname, "part_info_form_updated.html"));
  } else {
    res.redirect("/login");
  }
});

app.get("/create_account", (req, res) => {
  res.sendFile(path.join(__dirname, "create_account.html"));
});

app.get("/login", (req, res) => {
  let cookie = req.cookies;
  if (cookie.username != null) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "login.html"));
  }
});

app.get("/showcookies", (req, res) => {
  mycookies = req.cookies;
  res.send(mycookies);
});

app.get("/clear_cookies", (req, res) => {
  res.clearCookie("username");
  res.sendFile(path.join(__dirname, "cookies_cleared.html"));
});

app.get("/chat", (req, res) => {
  res.sendFile(path.join(__dirname, "chat.html"));
});

app.post("/create_account", async (req, res) => {
  console.log("Received Post Request");
  console.log("Form Data:", req.fields);
  const newData = {
    username: req.fields.userName,
    password: req.fields.password,
  };
  try {
    created = await DBconnection.createAccount(client, newData);
    if (!created) {
      res.send("account already exists");
    } else {
      res.redirect("/login");
    }
  } catch (error) {
    console.error("Error inserting Data", error);
    res.status(500).send("Error inserting data");
  }
});

app.post("/login", async (req, res) => {
  // get login information from form body and check if it exists in the database
  // if it does, redirect to the tools page with the username as a parameter
  // if it doesn't, redirect to the login page with an error message
  const userData = {
    username: req.fields.userName,
  };
  const userPassword = req.fields.password;
  try {
    await client.connect();
    const collection = client.db("arousmdb").collection("Accounts");
    const account = await collection.findOne(userData);
    if (account.password == userPassword) {
      if (account.username == "admin") {
        res.cookie("username", userData.username, {
          httpOnly: true,
        });
      } else {
        res.cookie("username", userData.username, {
          maxAge: 20000,
          httpOnly: true,
        });
      }
      return res.redirect("/");
    } else {
      res.send("Incorrect Login Information");
    }
    console.log(account);
  } catch (error) {
    console.error("Error fetching tools", error);
    res.status(500).send("Error fetching data");
  } finally {
    await client.close();
  }
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
    await DBconnection.insertListing(client, newData);
    res.send("Form Data Received and inserted");
  } catch (error) {
    console.error("Error inserting Data", error);
    res.status(500).send("Error inserting data");
  }
});

app.get("/tools", async (req, res) => {
  console.log("initiating GET request from mongodb");
  let cookie = req.cookies;
  if (cookie.username) {
    try {
      await client.connect();
      const collection = client.db("arousmdb").collection("Tools");
      const tools = await collection.find({}).toArray();

      // Start HTML string with embedded CSS
      let htmlResponse = `
      <html>
      <head>
        <title>Tools List</title>
        <style>
          body {
            background-color: #333; /* Dark grey background */
            color: #fff; /* White text color */
            font-family: Arial, sans-serif;
          }
          .container {
            max-width: 1200px;
            margin: auto;
            padding: 20px;
          }
          .row {
            display: flex;
            flex-wrap: wrap;
            margin-right: -15px;
            margin-left: -15px;
          }
          .col {
            padding: 15px;
            flex: 0 0 33.333333%; /* Adjust this to change how many items per row */
            max-width: 33.333333%;
          }
          .card {
            background-color: #444; /* Lighter grey for cards */
            border: 1px solid #777;
            border-radius: 5px;
            padding: 20px;
            margin-bottom: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Tools List</h2>
          <div class="row">`;

      // Append each tool to the HTML string
      tools.forEach((tool) => {
        htmlResponse += `
        <div class="col">
          <div class="card">
            <h5 class="card-title">${tool.part}</h5>
            <p class="card-text">${tool.descr}</p>
            <p class="card-text">${tool.price}</p>
          </div>
        </div>`;
      });

      // Close the HTML string
      htmlResponse += `
          </div>
        </div>
        <div class="center-button">
            <a href="/showcookies">show cookies</a>
        </div>
        <div class="center-button">
            <a href="/clear_cookies">clear cookies</a>
        </div>
      </body>
      </html>`;

      res.send(htmlResponse);
    } catch (error) {
      console.error("Error fetching tools", error);
      res.status(500).send("Error fetching data");
    } finally {
      await client.close();
    }
  } else {
    res.redirect("/login");
  }
});

// ------------------ End of Routes ------------------
//
//
// ------------------ Start of Server ------------------

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
