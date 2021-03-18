var express = require('express');
var router = express.Router();
var mongo = require('mongodb')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Scoreboard'
  });
});

module.exports = router;
