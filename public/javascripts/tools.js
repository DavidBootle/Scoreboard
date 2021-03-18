function showAlert(text, type='danger') {
    var alert = $(
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`)
    $('#alert-box').append(alert)
}

async function newTeam() {

    var name = $('#name').val()
    var id = $('#id').val()
    var score = $('#score').val()

    // reset submission feedback
    $('#alert-box').empty()
    $('#name').removeClass('invalid')
    $('#id').removeClass('invalid')
    $('#score').removeClass('invalid')

    if (name == '') {
        showAlert('Team must have a name.')
        $('#name').addClass('invalid')
    }
    if (id == '') {
        showAlert('Team must have an id.')
        $('#id').addClass('invalid')
    }
    if (score == '') {
        showAlert('Team must have a starting score.')
        $('#score').addClass('invalid')
    }
    if (name == '' || id == '' || score == '') {
        return
    }

    if (parseInt(score) != NaN) {
        score = parseInt(score)
    } else {
        showAlert('Starting score must be an integer.')
        $('#score').addClass('invalid')
        return
    }

    const response = await fetch('/tools/newteam', {
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
    // Location for server: /routes/tools.js
    const errorCode = {
        DATABASE_ERROR: 'database_error',
        TEAM_EXISTS: 'team_exists',
        FAILED_INSERT: 'failed_insert'
    }

    if (data.ok == true) {
        showAlert('New team successfully added. <a href="/tools" class="alert-link">Click here</a> to go back to Tools.', 'success');
    } else {
        showAlert(data.reason);

        if (data.errorCode == errorCode.TEAM_EXISTS) {
            $('#id').addClass('invalid')
        }
    }
}