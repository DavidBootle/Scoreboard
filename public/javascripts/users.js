async function newUser() {

    var username = $('#username').val()
    var password = $('#password').val()
    var passwordConfirmation = $('#passwordConfirmation').val()

    $('#alert-box').empty()

    // check if passwords match
    if (password != passwordConfirmation) {
        showAlert('Passwords must match');
        return;
    }

    const doc = {
        username: username,
        password: password
    }

    const response = await fetch('/users/newuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(doc)
    })

    if (response.status == 401) {
        showAlert('Unauthorized. Please log in.')
        return
    }

    const data = await response.json();

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 004
    // Location for server: /routes/users.js
    const errorCode = {
        DATABASE_ERROR: 'database_error',
        USER_EXISTS: 'user_exists',
        FAILED_INSERT: 'failed_insert'
    }

    if (data.ok == true) {
        showAlert('New user successfully added. <a href="/users" class="alert-link">Click here</a> to go back to Users.', 'success');
    } else {
        if (data.errorCode == errorCode.USER_EXISTS) {
            invalidate('#username')
            $('#usernameFeedback').text('A user with that name already exists')
        } else {
            showAlert(data.reason);
        }
    }
    
}