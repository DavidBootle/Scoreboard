var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcrypt');

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

router.get('/newuser', requireAuth, async function (req, res) {
  res.render('newuser', {
    title: 'New User',
    user: req.user
  })
});

router.post('/newuser', requireAuth, async function (req, res) {

  var username = req.body.username;
  var password = await bcrypt.hash(req.body.password, 10);

  var client = new MongoClient(req.app.get('databaseUrl'));

  // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
  // ERROR CODE SET 004
  // Location for client: /javascripts/users.js
  const errorCode = {
    DATABASE_ERROR: 'database_error',
    USER_EXISTS: 'user_exists',
    FAILED_INSERT: 'failed_insert'
  }
  
  try {
    await client.connect();

    var dbo = client.db('scoreboard');
    var users = dbo.collection('users');

    // check if team already exists (based on id parameter)
    var matchingUser = await users.findOne({username: username})
    if (matchingUser != null) {
      res.json({
        ok: false,
        reason: `A user with the username ${username} already exists`,
        errorCode: errorCode.USER_EXISTS
      })
      return
    }

    const doc = {
      username: username,
      password: password,
      accountType: 'standard'
    };
    const result = await users.insertOne(doc);

    if (result.insertedCount == 0) {
      res.json({
        ok: false,
        reason: 'Failed to insert user into database',
        errorCode: errorCode.FAILED_INSERT
      });
    } else {

      // update clients
      var io = req.app.get('io');
      io.emit('user-update');

      res.json({
        ok: true
      });
    }
  }
  catch (e) {
    res.json({
      ok: false,
      reason: 'Database error',
      errorCode: errorCode.DATABASE_ERROR
    })
    console.dir(e)
  }
  finally {
    client.close()
  }
})

module.exports = router;
