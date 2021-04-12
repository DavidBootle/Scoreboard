var express = require('express')
var router = express.Router()
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

    var confirm = req.query.confirm == 'false' ? false : true

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var dbo = client.db('scoreboard');
        var teams = await dbo.collection('teams').find({}).sort({'id': 1, '_id': 1}).toArray();

        var scoreLabel = process.env.SCORE_LABEL || 'Score';

        res.render('teams', {
            title: 'Teams',
            teams: teams,
            user: req.user,
            confirm: confirm,
            nonce: res.locals.nonce,
            scoreLabel: scoreLabel
        });
    }
    catch (e) {
        res.status(500).render('error', {
            error: e,
            message: 'Database error'
        })
        console.dir(e);
    }
    finally {
        client.close();
    }
})

router.get('/newteam', requireAuth, function (req, res) {
    res.render('newteam', {
        title: 'New Team',
        user: req.user,
        nonce: res.locals.nonce
    });
})

router.post('/newteam', requireAuth, async function (req, res) {

    console.dir(req.body)

    var name = req.body.name;
    var id = req.body.id;
    var score = String(req.body.score);

    // verify all arguments exist
    if (name == undefined || id == undefined || score == undefined) {
        res.status(400).send('One or more required parameters are missing.');
        return;
    }

    // argument validation
    if (name == '' || id == '' || score == '' || name.length > 40 || !/^[A-Za-z0-9 \-_]+$/.test(name) || id.length != 3 || !/^[0-9]*$/.test(id) || score.length > 30 || !/^\-?[0-9]+$/.test(score) || parseInt(score) == NaN) {
        res.status(400).send('One or more required parameters did not meet validation requirements.')
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 001
    // Location for client: /javascripts/teams.js
    const errorCode = {
        DATABASE_ERROR: 'database_error',
        TEAM_EXISTS: 'team_exists',
        FAILED_INSERT: 'failed_insert'
    }
    
    try {
        await client.connect();

        var dbo = client.db('scoreboard');
        var teams = dbo.collection('teams');

        // check if team already exists (based on id parameter)
        var matchingTeam = await teams.findOne({id: id})
        if (matchingTeam != null) {
            res.status(409).json({
                ok: false,
                reason: `A team with the identifier ${id} already exists`,
                errorCode: errorCode.TEAM_EXISTS
            })
            return
        }
        var randomNumber;
        var unique = false;
        while (!unique) {
            // generate new number
            randomNumber = ''
            for (var i = 0; i < 6; i++) {
                randomNumber += Math.floor(Math.random() * 10)
            }
            // check if unique
            var matchingRand = await teams.findOne({password: randomNumber});
            if (matchingRand == null) {
                unique = true;
            }
        }

        const doc = {
            name: name,
            id: id,
            score: parseInt(score),
            password: randomNumber
        };
        const result = await teams.insertOne(doc);

        if (result.insertedCount == 0) {
            res.status(500).json({
                ok: false,
                reason: 'Failed to insert team into database',
                errorCode: errorCode.FAILED_INSERT
            });
        } else {

            // update clients
            var io = req.app.get('io');
            io.emit('scoreboard-update');

            res.status(201).json({
                ok: true
            });
        }
    }
    catch (e) {
        res.status(500).json({
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

router.post('/removeteam', requireAuth, async (req, res) => {
    var id = req.body.id.toString();

    if (id == undefined) {
        res.status(400).send('One or more required parameters are missing.');
        return;
    }

    if (id.length != 3 || !/^[0-9]*$/.test(id)) {
        res.status(400).send('One or more required parameters did not meet validation requirements.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var teams = client.db('scoreboard').collection('teams');

        const doc = {
            id: id
        };
        const result = await teams.deleteOne(doc);

        // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
        // ERROR CODE SET 003
        // Location for client: /javascripts/teams.js
        const errorCode = {
            DATABASE_ERROR: 'database_error',
            FAILED_DELETE: 'failed_delete'
        }

        if (result.deletedCount == 0) {
            res.status(500).json({
                ok: false,
                reason: 'Failed to delete',
                errorCode: errorCode.FAILED_DELETE
            });
        } else {
            // update clients
            var io = req.app.get('io');
            io.emit('scoreboard-update');

            res.status(200).json({
                ok: true
            });
        }
    } catch (e) {
        res.status(500).json({
            ok: false,
            reason: 'Database error',
            errorCode: errorCode.DATABASE_ERROR
        });
        console.dir(e);
    } finally {
        client.close();
    }
})

router.get('/editteam', requireAuth, async (req, res) => {

    var id = req.query.id;

    if (id == undefined) {
        res.status(400).send('One or more required parameters are missing.');
    }

    if (id.length != 3 || !/^[0-9]*$/.test(id)) {
        res.status(400).send('One or more required parameters did not meet validation requirements.');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var teams = client.db('scoreboard').collection('teams');

        var team = await teams.findOne({'id': id});

        if (team == undefined || team == null) {
            res.status(404).send("Team with identifier \"" + id + "\" doesn't exist.")
        }

        res.status(200).render('editteam', {
            title: 'Edit Team',
            user: req.user,
            team: team,
            nonce: res.locals.nonce
        });
    }
    catch (e) {
        res.status(500).render('error', {
            message: 'Database error',
            error: e
        })
    }
    finally {
        client.close()
    }
});

router.post('/editteam', requireAuth, async (req, res) => {

    var name = req.body.name;
    var id = req.body.id;
    var oldId = req.body.oldId;

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 007
    // Location for client: /javascripts/teams.js
    const errorCode = {
        DATABASE_ERROR: 'DATABASE_ERROR',
        FAILED_UPDATE: 'FAILED_UPDATE',
        TEAM_CONFLICTS: 'TEAM_CONFLICTS'
    }

    if (id == undefined || name == undefined || oldId == undefined ) {
        res.status(400).send('One or more required parameters are missing.')
    }

    name = String(name)
    id = String(id)
    oldId = String(oldId)

    if (name == '' || id == '' || oldId == '' || name.length > 40 || !/^[A-Za-z0-9 \-_]+$/.test(name) || id.length != 3 || !/^[0-9]*$/.test(id)) {
        res.status(400).send('One or more parameters did not meet validation requirements.')
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect()

        var teams = client.db('scoreboard').collection('teams');

        var matchingTeam = await teams.findOne({'id': id});

        if (matchingTeam != null && id != oldId) {
            res.status(409).json({
                ok: false,
                reason: 'ID in use',
                errorCode: errorCode.TEAM_CONFLICTS
            }); return;
        }

        const result = await teams.updateOne({'id': oldId}, { $set: {'id': id, 'name': name} });

        if (result.matchedCount == 0) {
            res.status(500).json({
                ok: false,
                reason: 'No team was updated',
                errorCode: errorCode.FAILED_UPDATE
            })
        } else {
            res.status(200).json({
                ok: true
            })

            // update clients
            var io = req.app.get('io');
            io.emit('scoreboard-update');
        }
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            reason: 'Database error',
            errorCode: errorCode.DATABASE_ERROR
        })
    }
    finally {
        client.close()
    }
});

router.get('/changescore', requireAuth, async (req, res) => {

    var id = req.query.id || '';

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {

        await client.connect()

        var teams = await client.db('scoreboard').collection('teams').find().sort({'id': 1}).toArray()

        res.render('changescore', {
            title: 'Change Score',
            user: req.user,
            teams: teams,
            selectedTeamId: id.toString(),
            nonce: res.locals.nonce
        })
    }
    catch (e) {
        res.render('error', {
            message: 'Failed to load',
            error: e
        });
        console.dir(e);
    }
    finally {
        client.close()
    }
})

router.post('/changescore', requireAuth, async (req, res) => {

    var id = req.body.id;
    var score = req.body.score;

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 008
    // Location for client: /javascripts/teams.js
    const errorCode = {
        DATABASE_ERROR: 'DATABASE_ERROR',
        FAILED_UPDATE: 'FAILED_UPDATE'
    }

    if (id == undefined) {
        res.status(400).send('"id" is a required parameter');
        return;
    }
    if (score == undefined) {
        res.status(400).send('"score" is a required parameter');
        return;
    }

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var teams = client.db('scoreboard').collection('teams');

        var result = await teams.updateOne({'id': id}, { $set: {'score': parseInt(score)}});

        if (result.modifiedCount == 0) {
            res.json({
                ok: false,
                reason: "No team with that ID",
                errorCode: errorCode.FAILED_UPDATE
            });
        } else {
            res.json({
                ok: true
            })

            // update clients
            var io = req.app.get('io');
            io.emit('scoreboard-update');
        }
    }
    catch (e) {
        res.status(500).json({
            ok: false,
            reason: 'Database error',
            errorCode: errorCode.DATABASE_ERROR
        })
        console.dir(e);
    }
    finally {
        client.close();
    }
})

module.exports = router