var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

/* GET home page. */

router.get('/', async function (req, res) {

  var io = req.app.get('io')

  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect();

    var dbo = client.db('scoreboard');
    var teams = await dbo.collection('teams').find({}).sort({'score': -1, '_id': 1}).toArray();

    var scoreboardTitle = process.env.SCOREBOARD_TITLE || 'Scoreboard';
    var scoreLabel = process.env.SCORE_LABEL || 'Score';

    res.render('index', {
      title: 'Scoreboard',
      teams: teams,
      user: req.user,
      nonce: res.locals.nonce,
      scoreboardTitle: scoreboardTitle,
      scoreLabel: scoreLabel
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