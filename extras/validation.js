validation = {}

// This function takes a list of variables and checks to make sure they exist. If they 
validation.exists = function (paramsList, res) {
    for (param of paramsList) {
        if (param == null) {
            res.status(400).send('One or more required parameters are missing.');
            return false;
        }
    }
    return true;
}

// takes a team name and validates it based on the validation criteria described in this function
validation.teamName = function (name, res, param_name = 'name') {
    let criteria = [
        name != '',
        name.length <= 40,
        /^[A-Za-z0-9 \-_]+$/.test(name)
    ]

    for (c of criteria) {
        if (!c) {
            res.status(400).send(`Parameter '${param_name}' failed to meet validation criteria.`);
            return false;
        }
    }

    return true
}

validation.teamID = function (id, res, param_name = 'id') {
    let criteria = [
        id.length == 3,
        /^[0-9]*$/.test(id)
    ]

    for (c of criteria) {
        if (!c) {
            res.status(400).send(`Parameter '${param_name}' failed to meet validation criteria.`);
            return false;
        }
    }
    
    return true;
}

validation.teamScore = function (score, res, param_name = 'score') {
    score = String(score)

    let criteria = [
        score != '',
        score.length <= 30,
        /^\-?[0-9]+$/.test(score),
        parseInt(score) != NaN
    ]

    for (c of criteria) {
        if (!c) {
            res.status(400).send(`Parameter '${param_name}' failed to meet validation criteria.`);
            return false;
        }
    }

    return true;
}

module.exports = validation