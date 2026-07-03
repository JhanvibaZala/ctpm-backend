//fetch and assign data to sidebar
async function fetchUser() {
    try {
        const response = await fetch("/dashboard/getuser")
        console.log(response)
        if (response.ok) {
            const data = await response.json();
            console.log(data.user)
            return data.user
        }
    } catch (err) {
        console.log(err)
    }
}

async function setUserData() {
    const user = await fetchUser()
    document.querySelector("#sidebar-user-fullname").innerHTML = `${user.first_name} ${user.last_name}`
    document.querySelector("#sidebar-username").innerHTML = `@${user.username}`
    if (user.profile_pic_path != null) {
        document.querySelector("#sidebar-user-profile").setAttribute("src", user.profile_pic_path);
    }
}

setUserData()