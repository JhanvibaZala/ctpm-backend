function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
        icon.innerHTML = `<i class="fa-solid fa-eye-slash"></i>`;
    } else {
        input.type = "password";
        icon.innerHTML = `<i class="fa-solid fa-eye"></i>`;
    }
}