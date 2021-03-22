var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const requireAuth = (req, res, next) => {
    if (req.user) {
        next();
    } else {
        if (req.method == "GET") {
            res.redirect(`/login?to=${encodeURIComponent(req.originalUrl)}`)
        }
        else {
            res.status(401).send('Invalid authorization token');
        }
    }
};

router.get('/', requireAuth, async function (req, res) {

  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
      await client.connect();

      var dbo = client.db('scoreboard');
      var users = await dbo.collection('users').find({}).sort({'username': 1}).toArray();

      res.render('users', {
          title: 'Users',
          users: users,
          user: req.user
      });
  }
  catch (e) {
      console.dir(e);
  }
  finally {
      client.close();
  }
})

module.exports = router;
