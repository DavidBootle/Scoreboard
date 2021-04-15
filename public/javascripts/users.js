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

    const data = await response.text();

    if (response.status == 201) {
        showAlert('New user successfully added. <a href="/users" class="alert-link">Click here</a> to go back to Users.', 'success');
    } else {
        if (response.status == 409) {
            invalidate('#username')
            $('#usernameFeedback').text('A user with that name already exists')
        } else {
            showAlert(data);
        }
    }
    
}

async function deleteUser(username, redirect=true) {

    if (!confirm('Are you sure? This cannot be undone.')) { return }
    if (!confirm('Are you absolutely sure?')) { return }

    $('#alert-box').empty()

    const doc = {
        username: username
    }

    const response = await fetch('/users/deleteuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(doc)
    })

    if (response.status == 403) {
        var error = await response.text();
        showAlert('Forbidden: ' + error);
        return
    }

    const data = await response.text()

    if (response.status == 200 && redirect) {
        window.location.assign('/login?to=' + encodeURIComponent('/users'))
    } else if (response.status == 200) {
        showAlert('User deleted. <a href="/users" class="alert-link">Click here</a> to go back to Users.', 'success');
    } else {
        showAlert(data);
        return
    }
}

async function changePassword() {
    
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

    var response = await fetch('/users/changepassword', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(doc)
    });

    if (response.status == 403) {
        var error = await response.json();
        showAlert('Forbidden: ' + error.reason);
        return
    }

    const data = await response.json()

    // BOTH THE CLIENT AND SERVER MUST SHARE THESE ERROR CODES FOR THIS FUNCTION
    // ERROR CODE SET 006
    // Location for server: /routes/users.js
    const errorCode = {
        DATABASE_ERROR: 'DATABASE_ERROR',
        FAILED_CHANGE: 'FAILED_CHANGE',
        INVALID_USER: 'INVALID_USER',
        IS_MASTER_USER: 'IS_MASTER_USER'
    }

    if (data.ok == true) {
        showAlert('Password changed. <a href="/users" class="alert-link">Click here</a> to go back to Users.', 'success');
    } else {
        showAlert(data.reason);
        return
    }
}

async function logoutUser() {
    var user = $('#user').val();

    $('#alert-box').empty()

    const response = await fetch('/users/master/logoutuser', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: user })
    })

    const data = await response.json()

    if (data.ok == true) {
        showAlert('User logged out. <a href="/users" class="alert-link">Click here</a> to go back to Users.', 'success');
    } else {
        showAlert(data.reason);
        return
    }
}