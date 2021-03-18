var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

var url = process.env.DATABASE_URL || "mongodb://localhost:27017/scoreboard"

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Connected to database!");
  db.close();
});

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Scoreboard'
  });
});

module.exports = router;
