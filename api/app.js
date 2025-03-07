const cookieParser = require("cookie-parser");
const { BASE_STORAGE_DIR } = require("./helper/fileHelper");
const trackVisitor = require("./middlewares/visitorTracking");
/*** App Init ***/
const express = require("express"),
  bodyParser = require("body-parser"),
  cors = require("cors"),
  morgan = require("morgan"),
  mongoose = require("mongoose"),
  fileUpload = require("express-fileupload"),
  path = require("path"),
  debug = require("debug")("kusgroup-be:server"),
  http = require("http"),
  moment = require("moment");

require("dotenv").config();

const app = express();
app.use(cors({ origin: "*" }));

app.use("/static", express.static(BASE_STORAGE_DIR));
app.use(express.static(path.join(__dirname, "../..")));
app.use(morgan("combined"));
app.use(fileUpload());

app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(trackVisitor);

/*** Database Connection ***/
try {
  mongoose.connect(process.env.DATABASE_URL);
  const db = mongoose.connection;
  db.on("error", console.error.bind(console, "connection error"));
  db.once("open", function (callback) {
    console.log("\n\n\n\n");
    console.log(
      `Server successfully compiled on ${moment().format(
        `YYYY-MM-DD HH:mm:ss`
      )} \nDatabase connection Success with port ${
        process.env.PORT
      }!\nConnect to MongDB Atlas\n\n\n\n\n`
    );
  });
} catch (error) {
  throw error;
}

/*** FOR CREATE NEW ROUTES ***/
require(`./routes`)(app);

/*** CRON SCHEDULER ***/
require("../api/cron/index");

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || "5100");
app.set("port", port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);
server.on("error", onError);
server.on("listening", onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== "listen") {
    throw error;
  }

  var bind = typeof port === "string" ? "Pipe " + port : "Port " + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case "EACCES":
      console.error(bind + " requires elevated privileges");
      process.exit(1);
      break;
    case "EADDRINUSE":
      console.error(bind + " is already in use");
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === "string" ? "pipe " + addr : "port " + addr.port;
  debug("Listening on " + bind);
}
