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
const User = require("./Controllers/UserController");
const cookieAuth = require("./Controllers/AuthController").cookieAuth;
const cookie = require("cookie");

// Static files
app.use(express.static(__dirname));
app.use(formidable());
app.use(cookieParser());

// Routes
app.get("/", async (req, res) => {
  let cookie = req.cookies;
  let auth = await cookieAuth(cookie, client);
  if (auth) {
    res.redirect("/chat");
  } else {
    res.redirect("/login");
  }
});

app.get("/create_account", (req, res) => {
  res.sendFile(path.join(__dirname, "/Pages/create_account.html"));
});

app.get("/login", async (req, res) => {
  let cookie = req.cookies;
  let auth = await cookieAuth(cookie, client);
  if (auth) {
    res.redirect("/");
  } else {
    res.sendFile(path.join(__dirname, "/Pages/login.html"));
  }
});

app.get("/showcookies", (req, res) => {
  mycookies = req.cookies;
  res.send(mycookies);
});

app.get("/registration-successful", (req, res) => {
  res.sendFile(path.join(__dirname, "/Pages/registration-successful.html"));
});

app.get("/logout", (req, res) => {
  res.clearCookie("id");
  res.redirect("/login");
});

app.get("/chat", async (req, res) => {
  var cookies = req.cookies;
  let auth = await cookieAuth(cookies, client);
  if (!auth) {
    res.redirect("/login");
  } else {
    res.sendFile(path.join(__dirname, "/Pages/chat.html"));
  }
});

app.get("/login-successful", (req, res) => {
  res.sendFile(path.join(__dirname, "/Pages/login-successful.html"));
});

app.post("/create_account", async (req, res) => {
  console.log("Received Post Request");
  console.log("Form Data:", req.fields);
  const newUserData = {
    username: req.fields.userName,
    password: req.fields.password,
  };
  const newUser = new User(newUserData);
  const created = await newUser.createAccount(client);
  if (!created) {
    res.send("account already exists");
  } else {
    console.log("Redirecting client....");
    res.redirect("/registration-successful");
  }
});

app.post("/login", async (req, res) => {
  let userData = {
    username: req.fields.userName,
    password: req.fields.password,
    id: null,
  };
  const user = new User(userData);
  const login = await user.login(client);
  if (login) {
    res.cookie("id", user.id, {
      httpOnly: true,
    });
    res.redirect("/chat");
  } else {
    res.send("Incorrect Login Information");
  }
});

// ------------------ End of Routes ------------------
//

// ------------------ Start of Server ------------------
//

var CircularBuffer = require("circular-buffer");
var onlineUsers = {};

const messageBuffer = new CircularBuffer(50);

io.use(async (socket, next) => {
  try {
    // Parse cookies from the handshake headers
    if (socket.request.headers.cookie) {
      const cookies = cookie.parse(socket.request.headers.cookie);
      let userId = cookies.id; // Use the correct cookie name here

      try {
        if (userId.startsWith("j:")) {
          userId = JSON.parse(userId.slice(2));
        }
      } catch (error) {
        return next(new Error("Invalid user ID format"));
      }

      console.log("Extracted userId: ", userId); // This should now be the actual ID

      if (userId) {
        let user = await User.fetchUser(client, userId);
        if (user) {
          socket.user = user;
          return next();
        }
      }
    }
    // If no userId or user is found, pass an error to the next middleware
    next(new Error("Authentication Error"));
  } catch (err) {
    console.error("Authentication error:", err.message);
    next(new Error("Authentication Error"));
  }
});

io.on("connection", (socket) => {
  userClient = {
    username: socket.user.username,
    socketId: socket.id,
  };
  onlineUsers[socket.user.username] = userClient;
  console.log(`user connected: [${socket.user.username}]`);
  var userList = [];
  for (var key in onlineUsers) {
    userList.push(onlineUsers[key].username);
  }

  var userData = {
    users: Object.keys(onlineUsers),
  };

  io.emit("getUsers", userData);
  console.log(userData.users);

  socket.on("chat message", (msg) => {
    data = { user: socket.user.username, text: msg };
    messageBuffer.enq(data);

    if (msg === "/log") {
      if (socket.user.username == "admin") {
        console.log("Logging buffer:");
        for (let i = 0; i < messageBuffer.size(); i++) {
          console.log(messageBuffer.get(i));
        }
      } else {
      }
    } else {
      io.emit("chat message", { user: socket.user.username, text: msg });
    }
  });

  socket.on("disconnect", () => {
    console.log(`user disconnected: [${socket.user.username}]`);
    delete onlineUsers[socket.user.username];
    userData = {
      users: Object.keys(onlineUsers),
    };
    io.emit("getUsers", userData);
  });

  socket.on("privatemessage", (msg) => {
    let receiver = msg.receiver;
    let sender = socket.user.username;
    let message = msg.message;
    let receiverSocket = onlineUsers[receiver];
    if (receiverSocket) {
      io.to(receiverSocket.socketId).emit("privatemessage", {
        sender: sender,
        message: message,
      });
    }
  });
});

// Start server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
