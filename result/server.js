const express = require('express');
const async = require('async');
const { Pool } = require('pg');
const cookieParser = require('cookie-parser');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');

const app = express();
const server = http.Server(app);
const io = socketIO(server);

// Port configuration
const port = process.env.PORT || 8081;

// Socket.io setup
io.on('connection', function (socket) {
  socket.emit('message', { text: 'Welcome!' });

  socket.on('subscribe', function (data) {
    socket.join(data.channel);
  });
});

// PostgreSQL connection using system environment variables
const pool = new Pool({
  connectionString: `postgres://${process.env.POSTGRES_USER}:${process.env.POSTGRES_PASSWORD || ''}@${process.env.POSTGRES_HOST}:${process.env.POSTGRES_PORT}/${process.env.POSTGRES_DATABASE}`
});

// Retry connecting to the PostgreSQL server
async.retry(
  { times: 1000, interval: 1000 },
  function (callback) {
    pool.connect(function (err, client, done) {
      if (err) {
        console.error("Waiting for db");
      }
      callback(err, client);
    });
  },
  function (err, client) {
    if (err) {
      return console.error("Giving up");
    }
    console.log("Connected to db");
    getVotes(client);
  }
);

// Function to query votes data
function getVotes(client) {
  client.query('SELECT vote, COUNT(id) AS count FROM votes GROUP BY vote', [], function (err, result) {
    if (err) {
      console.error("Error performing query: " + err);
    } else {
      const votes = collectVotesFromResult(result);
      io.sockets.emit("scores", JSON.stringify(votes));
    }

    // Query every second to keep data up to date
    setTimeout(function () { getVotes(client); }, 1000);
  });
}

// Collect and format vote counts from query result
function collectVotesFromResult(result) {
  const votes = { a: 0, b: 0 };

  result.rows.forEach(function (row) {
    votes[row.vote] = parseInt(row.count);
  });

  return votes;
}

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Static file handling for both routes
app.use('/', express.static(__dirname + '/views'));
app.use('/result', express.static(__dirname + '/views'));

// Route handling
app.get('/', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/views/index.html'));
});

// Route for the result page
app.get('/result', function (req, res) {
  res.sendFile(path.resolve(__dirname + '/views/result.html'));
});

// Subdomain-based routing
app.use((req, res, next) => {
  const host = req.headers.host || '';
  
  if (host.startsWith('result.')) {
    // Route to /result when using result.vote.in
    if (req.path === '/') {
      return res.sendFile(path.resolve(__dirname + '/views/result.html'));
    }
    if (req.path.startsWith('/')) {
      return express.static(__dirname + '/views')(req, res, next);
    }
  }
  next();
});

// Start server
server.listen(port, function () {
  console.log('App running on port ' + port);
});

