var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;
var bcrypt = require('bcrypt');
var validation = require('../extras/validation');
var databaseTools = require('../extras/database-tools');

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

const requireMasterAuth = (req, res, next) => {
  if (req.user.accountType == 'master') {
    next();
  } else {
    res.status(403).send('Must be master user to access this page.')
  }
}

router.get('/', requireAuth, async function (req, res) {

  databaseTools.run(req, res, async (client) => {
    var users = await databaseTools.users(client).find({}).sort({'username': 1}).toArray();

    res.status(200).render('users', {
      title: 'Users',
      users: users,
      user: req.user,
      nonce: res.locals.nonce
    });
  });
})

router.get('/newuser', requireAuth, async function (req, res) {
  res.render('newuser', {
    title: 'New User',
    user: req.user,
    nonce: res.locals.nonce
  })
});

router.post('/newuser', requireAuth, async function (req, res) {

  var username = req.body.username;
  var unencryptedPassword = req.body.password;

  if (!validation.exists([username, unencryptedPassword], res)) { return }

  var password = await bcrypt.hash(unencryptedPassword, 10);

  databaseTools.run(req, res, async (client) => {
    var users = databaseTools.users(client);

    // check if team already exists (based on id parameter)
    var matchingUser = await users.findOne({username: username})
    if (matchingUser != null) {
      res.status(409).send(`A user with the username ${username} already exists`);
      return
    }

    const doc = {
      username: username,
      password: password,
      accountType: 'standard'
    };
    const result = await users.insertOne(doc);

    if (result.insertedCount == 0) {
      res.status(500).send('Failed to insert user into database');
    } else {

      res.status(201).send('ok');

      // update clients
      var io = req.app.get('io');
      io.emit('user-update');
    }
  });
});

router.post('/deleteuser', requireAuth, async (req, res) => {

  var username = req.body.username;

  if (!validation.exists([username], res)) { return }

  // check to see if user is the same
  if (req.user.username != username && req.user.accountType != 'master') {
    res.status(403).send('Cannot delete another user.');
    return
  }

  databaseTools.run(req, res, async (client) => {
    var users = databaseTools.users(client);

    var user = await users.findOne({'username': username});

    if (user == null) {
      res.status(404).send('User does not exist.');
    }

    // check to see if user being deleted is the master user
    if (user.accountType == 'master') {
      res.status(403).send('Cannot delete the master user.');
      return
    }

    var result = await users.deleteOne({'username': username});

    if (result.deletedCount == 0) {
      res.status(500).send('Failed to delete.');
      return
    } else {
      // update clients
      var io = req.app.get('io');
      io.emit('user-update');

      // logoff users
      if (user.sockets != undefined) {
        for (socketId of user.sockets) {
          io.to(socketId).emit('logoff');
        }
      }

      res.status(200).send(`User ${username} was removed.`);
    }
  });
});

router.get('/changepassword', requireAuth, (req, res) => {

  res.render('changepassword', {
    title: 'Change Password',
    user: req.user,
    nonce: res.locals.nonce
  })
});

router.post('/changepassword', requireAuth, async (req, res) => {

  var username = req.body.username;
  var password = req.body.password;

  // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
  // ERROR CODE SET 006
  // Location for client: /javascripts/users.js
  const errorCode = {
    DATABASE_ERROR: 'DATABASE_ERROR',
    FAILED_CHANGE: 'FAILED_CHANGE',
    INVALID_USER: 'INVALID_USER',
    IS_MASTER_USER: 'IS_MASTER_USER'
  }

  // check to see if user is the same or if master user is requesting password change
  if (req.user.username != username && req.user.accountType != 'master') {
    res.status(403).json({
      ok: false,
      reason: 'Cannot change the password of another user.',
      errorCode: errorCode.INVALID_USER
    });
    return
  }

  // check to see if user being deleted is the master user
  if (username == process.env.MASTER_USER) {
    res.status(403).json({
      ok: false,
      reason: 'Cannot change the password of the master user.',
      errorCode: errorCode.IS_MASTER_USER
    });
    return
  }

  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect()

    var users = client.db('scoreboard').collection('users');

    // change password
    var newPassword = await bcrypt.hash(password, 10);
    var result = await users.updateOne({'username': username}, {$set: {'password': newPassword}})

    if (result.modifiedCount == 0) {
      res.json({
        ok: false,
        reason: 'Failed to change password',
        errorCode: errorCode.FAILED_CHANGE
      });
      return
    } else {
      res.json({
        ok: true
      })
    }
  }
  catch (e) {
    res.json({
      ok: false,
      reason: 'Database error',
      errorCode: errorCode.DATABASE_ERROR
    });
    console.dir(e)
  }
  finally {
    client.close()
  }
});

router.get('/master/logoutuser', requireAuth, requireMasterAuth, async (req, res) => {

  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect()

    var usersCollection = client.db('scoreboard').collection('users');

    var users = await usersCollection.find({'accountType': { $ne: 'master'}}).sort({'username': 1}).toArray();

    res.render('masterlogoutuser', {
      title: "Log Out A User",
      user: req.user,
      users: users,
      nonce: res.locals.nonce
    })
  }
  catch (e) {
    res.render('error', {
      message: "Failed to load",
      error: e
    });
    console.dir(e);
  }
  finally {
    client.close();
  }
})

router.post('/master/logoutuser', requireAuth, requireMasterAuth, async (req, res) => {

  var username = req.body.username;

  var client = new MongoClient(req.app.get('databaseUrl'));

  // log out all connected sockets for that user
  try {
    await client.connect()
    
    var users = client.db('scoreboard').collection('users')
    
    const result = await users.updateOne({'username': username}, {$unset: {'token': ''}})

    var user = await users.findOne({'username': username});

    if (user != undefined) {
      if (user.sockets != undefined) {
        for (socketId of user.sockets) {
          var io = req.app.get('io');
          io.to(socketId).emit('logoff');
        }
        res.json({
          ok: true
        });
        return
      } else {
        res.json({
          ok: true
        })
      }
    } else {
      res.json({
        ok: false,
        reason: 'User does not exist'
      })
      return
    }
  }
  catch (e) {
    res.json({
      ok: false,
      reason: 'Database error'
    })
    console.dir(e);
  }
  finally {
    client.close()
  }
});

router.get('/master/changepassword', requireAuth, requireMasterAuth, async (req, res) => {
  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect()

    var usersCollection = client.db('scoreboard').collection('users');

    var users = await usersCollection.find({'accountType': { $ne: 'master'}}).sort({'username': 1}).toArray();

    res.render('masterresetuserpassword', {
      title: "Reset A User's Password",
      user: req.user,
      users: users,
      nonce: res.locals.nonce
    })
  }
  catch (e) {
    res.render('error', {
      message: "Failed to load",
      error: e
    });
    console.dir(e);
  }
  finally {
    client.close();
  }
})

router.get('/master/deleteuser', requireAuth, requireMasterAuth, async (req, res) => {
  var client = new MongoClient(req.app.get('databaseUrl'));

  try {
    await client.connect()

    var usersCollection = client.db('scoreboard').collection('users');

    var users = await usersCollection.find({'accountType': { $ne: 'master'}}).sort({'username': 1}).toArray();

    res.render('masterdeleteuser', {
      title: "Delete User",
      user: req.user,
      users: users,
      nonce: res.locals.nonce
    })
  }
  catch (e) {
    res.render('error', {
      message: "Failed to load",
      error: e
    });
    console.dir(e);
  }
  finally {
    client.close();
  }
})

module.exports = router;
