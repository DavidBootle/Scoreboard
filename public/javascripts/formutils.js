function showAlert(text, type='danger') {
    var alert = $(
    `<div class="alert alert-${type} alert-dismissible fade show" role="alert">
        ${text}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`)
    $('#alert-box').append(alert)
}

function validate(object) {
    $(object).addClass('is-valid')
    $(object).removeClass('is-invalid')
}

function invalidate(object) {
    $(object).removeClass('is-valid')
    $(object).addClass('is-invalid')
}

function unvalidate(object) {
    $(object).removeClass('is-valid')
}

function uninvalidate(object) {
    $(object).removeClass('is-invalid')
}

/**
 * This function takes an assessment function (assess) and a jquery or dom object (object)
 * 
 * Its purpose is to evaluate whether or not the given function returns true, or false, and then invalidate or validate the object
 * depending on the result.
 * 
 * In this the assess function must be in the following format:
 * 
 * (value) => { return (bool expression) }
 * 
 * If the assessment returns true, the object is validated.
 * If the assessment returns false, the object is invalidated.
 */

function requirement(object, messageObject, messageText, assess) {
    var value = $(object).val()

    var valid = assess(value)

    if (valid) {
        validate(object)
    } else {
        invalidate(object)
        $(messageObject).text(messageText)
    }

    return valid
}