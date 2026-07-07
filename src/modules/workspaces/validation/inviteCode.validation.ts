export function isValidInviteCode(code: string) {
    // Length should be 11 (6 + '-' + 4)
    if (code.length !== 11) {
        return false;
    }

    // Hyphen should be at index 6
    if (code[6] !== "-") {
        return false;
    }

    // Remove hyphen
    const parts = code.split("-");

    if (parts.length !== 2) {
        return false;
    }

    const [first, second] = parts;

    if (first.length !== 6 || second.length !== 4) {
        return false;
    }

    const validChars = "0123456789ABCDEF";

    for (const ch of first + second) {
        if (!validChars.includes(ch)) {
            return false;
        }
    }

    return true;
}