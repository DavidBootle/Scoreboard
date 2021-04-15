var MongoClient = require('mongodb').MongoClient;

var databaseTools = {};

databaseTools.run = async function (req, res, func) {

    var client = new MongoClient(req.app.get('databaseUrl'));

    try {
        await client.connect();

        await func(client);
    }
    catch (e) {
        var method = req.method;
        if (method == 'GET') {
            res.status(500).render('error', {
                error: e,
                message: 'Database error'
            });
        } else if (method == 'POST') {
            res.status(500).send('Database error');
        } else {
            throw Error('method must be "POST" or "GET"');
        }
        
        console.dir(e);
    }
    finally {
        client.close();
    }
}

module.exports = databaseTools;