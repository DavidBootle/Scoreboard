var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */

router.get('/', async function (req, res) {

  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect();

    var dbo = client.db('scoreboard');
    var teams = await dbo.collection('teams').find({}).toArray();

    res.render('index', {
      title: 'Scoreboard',
      teams: teams,
      user: req.user
    });
  }
  catch (e) {
    console.dir(e);
  }
  finally {
    client.close();
  }
});

module.exports = router;