const projectId = document.getElementById("projectId").value;
const workspaceId = document.getElementById("workspaceId").value;
const startDate = document.getElementById("startDate");
const startDateText = document.getElementById("startDateText");


startDate.addEventListener("change",()=>{

    if(startDate.value){

        const date = new Date(startDate.value);

        startDateText.innerText = date.toDateString();

    }
    else{

        startDateText.innerText="No start date";

    }

});

const dueDate = document.getElementById("dueDate");
const dueDateText = document.getElementById("dateText");


dueDate.addEventListener("change",()=>{

    if(dueDate.value){

        const date = new Date(dueDate.value);

        dueDateText.innerText = date.toDateString();

    }
    else{

        dueDateText.innerText="No due date";

    }

});


// shows picker
function openStartDatePicker(){

    const input = document.getElementById("startDate");

    if(input.showPicker){
        input.showPicker();
    }
    else{
        input.click();
    }

}



function openDueDatePicker(){

    const input = document.getElementById("dueDate");

    if(input.showPicker){
        input.showPicker();
    }
    else{
        input.click();
    }

}


// ============================= status fetch
const statusDiv = document.getElementById("statuses");
// for getting data back after validation
const oldstatus = document.getElementById("oldStatus").value;
// console.log(oldStatus.value)
async function getStatuses() {
    try {
        console.log(
    `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/statuses/get`
);
        console.log(projectId, workspaceId)
        const getStatus = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/statuses/get`, {
            method: "GET"
        })
        console.log("Hello")
        if(getStatus.ok) {
            const data = await getStatus.json();
            const statuses = data.data;
            console.log("statuses");
            console.log(statuses);
            statuses.forEach(status => {
                const option = document.createElement("option");
                option.value = status.id;
                option.innerText = status.status_text;
                // console.log(oldStatus)
                if(oldStatus.value == status.id) {
                    option.selected = true;
                }
                statusDiv.append(option);
                
            })
        }
        } catch (error) {
             console.log("Fetch error:", error);
        }
}

getStatuses();


// ============================= assignees fetch
const searchBox = document.getElementById("assigneeSearch");

const dropdown = document.getElementById("assigneeDropdown");

const selectedDiv = document.getElementById("selectedAssignees");

const hiddenInput = document.getElementById("assigneesInput");


let selectedUsers = [];



searchBox.addEventListener("input", async()=>{


    const value = searchBox.value;


    if(value.length < 2){

        dropdown.style.display="none";

        return;

    }



    const response = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/members?search=${value}`
    );

    const data = await response.json();

    dropdown.innerHTML="";


    data.data.forEach(user=>{


        const div=document.createElement("div");


        div.className="assignee-option";


        div.innerText=user.username;



        div.onclick=()=>{

            addAssignee(user);

        };


        dropdown.appendChild(div);


    });


    dropdown.style.display="block";


});



function addAssignee(user){


    const exists = selectedUsers.find(
        u=>u.id===user.id
    );


    if(exists)
        return;



    selectedUsers.push(user);



    renderAssignees();


    searchBox.value="";

    dropdown.style.display="none";


}




function renderAssignees(){


    selectedDiv.innerHTML="";


    selectedUsers.forEach(user=>{


        const chip=document.createElement("div");


        chip.className="assignee-chip";


        chip.innerHTML=`

            ${user.username}

            <span onclick="removeAssignee('${user.id}')">
                ×
            </span>

        `;


        selectedDiv.appendChild(chip);


    });



    hiddenInput.value =
        selectedUsers.map(
            user=>user.id
        ).join(",");


}



function removeAssignee(id){


    selectedUsers =
        selectedUsers.filter(
            user=>user.id!==id
        );


    renderAssignees();


}

// ============================= files
const fileInput = document.getElementById("attachments");
const fileList = document.getElementById("fileList");

let selectedFiles = [];

// When files are selected
fileInput.addEventListener("change", (event) => {

    const files = Array.from(event.target.files);

    // console.log(files);

    // Add newly selected files
    selectedFiles = [...selectedFiles, ...files];

    displayFiles();

    // Reset input so same file can be selected again after removing
    fileInput.value = "";
});


// Display selected files
function displayFiles() {

    fileList.innerHTML = "";

    selectedFiles.forEach((file, index) => {

        const div = document.createElement("div");
        div.classList.add("file-item");

        div.innerHTML = `
            <span class="file-name">
                ${file.name}
            </span>

            <i class="fa-solid fa-xmark remove-file"></i>
        `;


        // Remove button click
        div.querySelector(".remove-file").addEventListener("click", () => {
            removeFile(index);
        });


        fileList.appendChild(div);

    });

}


// Remove file
function removeFile(index) {

    selectedFiles.splice(index, 1);

    displayFiles();

}

const taskForm = document.querySelector("form");
// Before submitting form, update file input
taskForm.addEventListener("submit", () => {

    const dataTransfer = new DataTransfer();


    selectedFiles.forEach(file => {
        dataTransfer.items.add(file);
    });


    fileInput.files = dataTransfer.files;

});


// allowed file types

fileInput.addEventListener("change", (event) => {
    const files = Array.from(event.target.files);
    const allowedTypes = [
        "application/pdf",

        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",

        "image/png",
        "image/jpeg",
        "image/jpg",
        "image/webp"
    ];


    const validFiles = files.filter(file => {
        if(!allowedTypes.includes(file.type)) {
            alert(`${file.name} is not an allowed file type`);
            return false;
        }
        return true;
    });


    selectedFiles = [
        ...selectedFiles,
        ...validFiles
    ];

    displayFiles();

    fileInput.value = "";

});


function showToast(message,type){
    const toast=document.getElementById("toast");
    toast.innerText=message;
    toast.className=type;
    toast.style.display="block";
    setTimeout(()=>{
        toast.style.display="none";
    },3000);
}