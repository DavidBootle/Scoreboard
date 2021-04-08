var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

const requireAuth = async (req, res, next) => {
    var authToken = req.headers.authorization;

    if (authToken == null) {
        res.status(401).send('Invalid authorization header.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect()

        var teams = client.db('scoreboard').collection('teams');

        var team = await teams.findOne({'token': authToken});

        if (team == null) {
            res.status(401).send('Invalid authorization header.');
        } else {
            req.team = team;

            next();
        }
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close()
    }
}

router.post('/get/teamscore', async (req, res) => {

    var id = req.body.id;

    if (!id) {
        res.status(400).send('Valid request must include id parameter.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect()

        var teams = client.db('scoreboard').collection('teams');

        var team = await teams.findOne({'id': id});

        if (team == null) {
            res.status(404).send('No team with that id.');
            return;
        }

        res.status(200).send(team.score.toString());
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close();
    }
})

router.post('/get/authtoken', async (req, res) => {

    var password = req.body.password;

    if (password == undefined) {
        res.status(400).send('One or more required parameters are missing.')
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect()

        var teams = client.db('scoreboard').collection('teams');

        var team = await teams.findOne({password: password});
        
        if (team == null) {
            res.status(401).send('Invalid.');
            return;
        }

        const generateAuthToken = req.app.get('generateAuthToken');
        const authToken = generateAuthToken()

        var result = await teams.updateOne({id: team.id}, { $set : {'token': authToken}});

        if (result.modifiedCount == 0) {
            res.status(500).send('Failed to update.');
            return;
        }

        res.status(200).send(authToken);
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close();
    }
})

router.post('/set/teamscore', requireAuth, async (req, res) => {
    var score = req.body.score;
    var id = req.team.id;

    if (score == undefined) {
        res.status(400).send('One or more required parameters are missing.');
        return;
    }

    if (parseInt(score) == NaN || score.length == 0 || score.length > 30 || !/^\-?[0-9]+$/.test(score)) {
        res.status(400).send('One or more parameters failed validation.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var teams = client.db('scoreboard').collection('teams');

        var result = await teams.updateOne({'id': id}, { $set: {'score': parseInt(score)}});

        if (result.modifiedCount == 0) {
            res.status(500).send('Failed to update');
            return;
        } else {
            res.status(200).send('ok');

            var io = req.app.get('io');
            io.emit('scoreboard-update');
        }
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close()
    }
})

router.post('/set/teamname', requireAuth, async (req, res) => {
    var name = req.body.name;
    var id = req.team.id;

    if (name == undefined) {
        res.status(400).send('One or more required parameters are missing.');
        return;
    }

    if (name == '' || name.length > 40 || !/^[A-Za-z0-9 \-_]+$/.test(name)) {
        res.status(400).send('One or more parameters failed validation.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var teams = client.db('scoreboard').collection('teams');

        var result = await teams.updateOne({'id': id}, { $set: {'name': name}});

        if (result.modifiedCount == 0) {
            res.status(500).send('Failed to update');
            return;
        } else {
            res.status(200).send('ok');

            var io = req.app.get('io');
            io.emit('scoreboard-update');
        }
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close()
    }
})

router.post('/get/name', requireAuth, async (req, res) => {
    res.status(200).send(req.team.name);
})

router.post('/get/id', requireAuth, (req, res) => {
    res.status(200).send(req.team.id);
})

router.post('/get/score', requireAuth, (req, res) => {
    res.status(200).send(req.team.score.toString());
})

router.post('/test', requireAuth, (req, res) => {
    res.status(200).send('OK');
})

router.post('/get/teams', async (req, res) => {
    // gets a list of all current team information

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect()

        var teamsCollection = client.db('scoreboard').collection('teams');

        var projection = {'_id': 0, 'name': 1, 'id': 1, 'score': 1}

        var teams = await teamsCollection.find({}).project(projection).toArray();

        res.status(200).json(teams);
    }
    catch (e) {
        res.status(500).send('Database error');
        console.dir(e);
    }
    finally {
        client.close();
    }
})

module.exports = router;