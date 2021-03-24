var express = require('express');
var router = express.Router();
var MongoClient = require('mongodb').MongoClient;

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

module.exports = router;