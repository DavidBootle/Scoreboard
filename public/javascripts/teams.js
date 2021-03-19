async function newTeam() {

    var name = $('#name').val()
    var id = $('#id').val()
    var score = $('#score').val()

    // reset submission feedback
    $('#alert-box').empty()

    if (name == '' || id == '' || score == '' || !/[0-9]{3}/.test(id)) {
        return
    }

    if (parseInt(score) != NaN) {
        score = parseInt(score)
    } else {
        showAlert('Starting score must be an integer.')
        invalidate('#score')
        return
    }

    const response = await fetch('/teams/newteam', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            'name': name,
            'id': id,
            'score': score
        })
    })
    const data = await response.json();

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 001
    // Location for server: /routes/teams.js
    const errorCode = {
        DATABASE_ERROR: 'database_error',
        TEAM_EXISTS: 'team_exists',
        FAILED_INSERT: 'failed_insert'
    }

    if (data.ok == true) {
        showAlert('New team successfully added. <a href="/teams" class="alert-link">Click here</a> to go back to Teams.', 'success');
    } else {
        if (data.errorCode == errorCode.TEAM_EXISTS) {
            invalidate('#id')
            $('#idFeedback').text('Team already exists.')
        } else {
            showAlert(data.reason);
        }
    }
}