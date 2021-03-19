var express = require('express')
var router = express.Router()
var MongoClient = require('mongodb').MongoClient;

router.get('/', async function (req, res) {

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        var dbo = client.db('scoreboard');
        var teams = await dbo.collection('teams').find({}).toArray();

        res.render('tools', {
            title: 'Tools',
            teams: teams
        });
    }
    catch (e) {
        console.dir(e);
    }
    finally {
        client.close();
    }
})

router.get('/newteam', function (req, res) {
    res.render('newteam', {
        title: 'New Team'
    });
})

router.post('/newteam', async function (req, res) {

    var name = req.body.name;
    var id = req.body.id;
    var score = req.body.score;

    var client = new MongoClient(req.app.get('databaseUrl'));

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 001
    // Location for client: /javascripts/tools.js
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
            res.json({
                ok: false,
                reason: `A team with the identifier ${id} already exists`,
                errorCode: errorCode.TEAM_EXISTS
            })
            return
        }

        const doc = {
            name: name,
            id: id,
            score: score
        };
        const result = await teams.insertOne(doc);

        if (result.insertedCount == 0) {
            res.json({
                ok: false,
                reason: 'Failed to insert team into database',
                errorCode: errorCode.FAILED_INSERT
            });
        } else {
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

module.exports = router