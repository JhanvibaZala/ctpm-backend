export async function validateName(name: string) {
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

export async function validateUsername(username: string) {
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

export async function validateEmail(email: string) {
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

export async function validatePassword(password: string) {

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