function validateName(name) {
    if (!name) return { isValid: false, message: "Name is required" };

    // trim the leading and trailing whitespaces
    const cleanedName = name.trim();

    // check length constraints
    if (cleanedName.length < 2) {
        return { isValid: false, message: "Name is too short" };
    }
    if (cleanedName.length > 50) {
        return { isValid: false, message: "Name is too long" };
    }

    // test against reg exp
    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]['\s-]?([A-Za-zÀ-ÖØ-öø-ÿ]['\s-]?)*[A-Za-zÀ-ÖØ-öø-ÿ]$/;
    if (!nameRegex.test(cleanedName)) {
        return { isValid: false, message: "Name contains invalid characters" };
    }

    return { isValid: true, message: null };
}

function validateUsername(username) {
    if (!username) return { isValid: false, message: "Username is required" };

    // trim the leading and trailing whitespaces
    const cleanedUsername = username.trim();

    // check length constraints independently for precise feedback
    if (cleanedUsername.length < 3) {
        return { isValid: false, message: "Username is too short" };
    }
    if (cleanedUsername.length > 30) {
        return { isValid: false, message: "Username is too long" };
    }

    // test against reg exp
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,29}$/;
    if (!usernameRegex.test(cleanedUsername)) {
        return { isValid: false, message: "Username must start with an alphanumeric character and contain only letters, numbers, dots, hyphens, or underscores" };
    }

    return { isValid: true, message: null };
}

function validateEmail(email) {
    if (!email) return { isValid: false, message: "Email is required" };

    // trim the leading and trailing whitespaces and convert to lowercase
    const cleanedEmail = email.trim().toLowerCase();

    // check length constraints
    if (cleanedEmail.length > 254) {
        return { isValid: false, message: "Email is too long" };
    }

    // test against reg exp
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (!emailRegex.test(cleanedEmail)) {
        return { isValid: false, message: "Email format is invalid" };
    }

    return { isValid: true, message: null };
}

function validatePassword(password) {

    // checking against length constraints
    if (!password) {
        return { isValid: false, message: "Password is required" };
    }
    if (password.length < 8) {
        return { isValid: false, message: "Password is too short" };
    }
    if (password.length > 128) {
        return { isValid: false, message: "Password is too long" };
    }

    // test against individual criteria for specific feedback without changing regex functionality
    if (!/[A-Z]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one uppercase letter" };
    }
    if (!/\d/.test(password)) {
        return { isValid: false, message: "Password must contain at least one number" };
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        return { isValid: false, message: "Password must contain at least one special symbol" };
    }

    return { isValid: true, message: null };
}

function validateRegisterForm() {
    const fnameElem = document.getElementById('first-name')
    const lnameElem = document.getElementById('last-name')
    const unameElem = document.getElementById('username')
    const emailElem = document.getElementById('email')
    const passwordElem = document.getElementById('password')

    const fnameErrElem = document.getElementById('fnameErr')
    const lnameErrElem = document.getElementById('lnameErr')
    const unameErrElem = document.getElementById('unameErr')
    const emailErrElem = document.getElementById('emailErr')
    const passErrElem = document.getElementById('passErr')

    const fnameValRes = validateName(fnameElem.value)
    const lnameValRes = validateName(lnameElem.value)
    const unameValRes = validateUsername(unameElem.value)
    const emailValRes = validateEmail(emailElem.value)
    const passValRes = validatePassword(passwordElem.value)

    Array.from(document.getElementsByClassName('err')).forEach(elem => {
        elem.innerHTML = ""
    })

    if (!fnameValRes.isValid) {
        fnameErrElem.innerHTML = fnameValRes.message
        return false;
    }

    if (!lnameValRes.isValid) {
        lnameErrElem.innerHTML = lnameValRes.message
        return false;
    }

    if (!unameValRes.isValid) {
        unameErrElem.innerHTML = unameValRes.message
        return false;
    }

    if (!emailValRes.isValid) {
        emailErrElem.innerHTML = emailValRes.message
        return false;
    }

    if (!passValRes.isValid) {
        passErrElem.innerHTML = passValRes.message
        return false;
    }

    return true;
}