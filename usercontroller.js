const crypto = require("crypto");
const express = require("express");
const cors = require("cors");
const db_controller = require("./db_controller");

var users = express.Router();
let salt = "f844b09ff50c";

const client = db_controller.DBconnection.getInstance().client;
