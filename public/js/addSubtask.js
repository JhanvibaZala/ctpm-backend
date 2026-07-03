console.log("subtask loaded");
let projectIdSt = document.getElementById("projectId").value;
let workspaceIdSt = document.getElementById("workspaceId").value;
let taskIdSt = document.getElementById("taskId").value;
// open modal ==========================================
async function openSubtaskModal(){
    try {
        document
        .getElementById("subtaskModal")
        .style.display="flex";
        
        const response = await fetch(`/api/workspaces/${workspaceIdSt}/projects/${projectIdSt}/tasks/${taskIdSt}/get-data`)
        if(response.status === 200) {
            const data = await response.json();
            console.log(data.assignees)
            populateAssigneesSubtask(data); 
            populateStatusesSubtask(data)
        } else {
            showToast("Failed to get subtask assignees and statuses","error");
            return;
        }
    } catch (error) {
        showToast("Failed to get subtask assignees and statuses","error");
        return;
    }
}

// close modal ==========================================
function closeSubtaskModal(){

    document
    .getElementById("subtaskModal")
    .style.display="none";

}

// get assignees ==========================================
let selectedUsersSubtask = [];
let allUsersSubtask = [];

const searchSubtask =
document.getElementById("assigneeSearch");

const dropdownSubtask =
document.getElementById("assigneeDropdown");
searchSubtask.addEventListener("input",()=>{
    if(allUsersSubtask.length == 0) {
        return;
    }
    const value = searchSubtask.value.toLowerCase();
    dropdownSubtask.innerHTML="";
    
    if(value.length < 1){
        dropdownSubtask.style.display="none";
        return;
    }
    
    const filtered = allUsersSubtask.filter(user=>{
        return user.username
        .toLowerCase()
        .includes(value);
    });
    filtered.forEach(user=>{
        const div=document.createElement("div");
        div.className="assignee-option";
        div.innerText=user.username;
        div.onclick=()=>{
            
            addAssignee(user);
            
        };
        dropdownSubtask.appendChild(div);
    });
    dropdownSubtask.style.display="block";
});

function populateAssigneesSubtask(data){
    // selectedUsersSubtask = [...data.selectedAssignees]
    allUsersSubtask = [...data.assignees]
    renderSelectedAssigneesSubtask();
}

function removeAssigneeSubtask(id){
    selectedUsersSubtask = selectedUsersSubtask.filter(
        user=>user.id !== id
    );
    renderSelectedAssigneesSubtask();
}
function addAssignee(user){
    const exists = selectedUsersSubtask.some(
        u=>u.id === user.id
    );
    if(exists){
        return;
    }
    selectedUsersSubtask.push(user);
    renderSelectedAssigneesSubtask();
    searchSubtask.value="";
    dropdownSubtask.style.display="none";
}

// render selected users chips
function renderSelectedAssigneesSubtask(){
    const container = document.getElementById(
        "selectedAssignees"
    );
    const hiddenInput = document.getElementById(
        "assigneesInput"
    );
    container.innerHTML="";
    selectedUsersSubtask.forEach(user=>{
        const chip = document.createElement("div");
        chip.className="assignee-chip";
        chip.innerHTML = `
            ${user.username}

            <span onclick="removeAssigneeSubtask('${user.id}')">
                ×
            </span>

        `;
        container.appendChild(chip);
    });
    // send ids to backend
    hiddenInput.value = selectedUsersSubtask
        .map(user=>user.id)
        .join(",");
}

// dates =========================================
const startDateSubtask = document.getElementById("startDate");
const startDateTextSubtask = document.getElementById("startDateText");

startDateSubtask.addEventListener("change",()=>{

    if(startDateSubtask.value){

        const date = new Date(startDateSubtask.value);

        startDateTextSubtask.innerText = date.toDateString();

    }
    else{

        startDateTextSubtask.innerText="No start date";

    }

});

const dueDateSubtask = document.getElementById("dueDate");
const dueDateTextSubtask = document.getElementById("dueDateText");

dueDateSubtask.addEventListener("change",()=>{

    if(dueDateSubtask.value){

        const date = new Date(dueDateSubtask.value);

        dueDateTextSubtask.innerText = date.toDateString();

    }
    else{

        dueDateTextSubtask.innerText="No due date";

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

// statuses =================================================

// populate STATUSES if needed

function populateStatusesSubtask(data) {
    let statuses = data.statuses;
    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.id;
        option.text = status.status_text;
        document.getElementById("statuses").appendChild(option);
    })
}


// ===============================
// SUBTASK ATTACHMENTS
// ===============================

let subtaskFiles = [];

const subtaskAttachmentInput = 
document.getElementById("subtaskAttachments");

const subtaskFileList =
document.getElementById("subtaskFileList");


if(subtaskAttachmentInput){

    subtaskAttachmentInput.addEventListener(
        "change",
        (event)=>{
            const files = Array.from(
                event.target.files
            );
            subtaskFiles = [
                ...subtaskFiles,
                ...files
            ];
            renderSubtaskFiles();
            // reset input so same file can be selected again
            subtaskAttachmentInput.value = "";

        }
    );

}

function renderSubtaskFiles(){
    subtaskFileList.innerHTML = "";
    subtaskFiles.forEach((file,index)=>{
        const fileDiv = document.createElement("div");
        fileDiv.className = "subtask-file-item";
        fileDiv.innerHTML = `
            <i class="fa-solid fa-file"></i>
            <span>
                ${file.name}
            </span>
            <span 
                class="subtask-remove-file"
                onclick="removeSubtaskFile(${index})"
            >
                ×
            </span>

        `;
        subtaskFileList.appendChild(fileDiv);
    });

}

function removeSubtaskFile(index){
    subtaskFiles.splice(index,1);
    renderSubtaskFiles();
}

// ===============================
// SUBTASK CREATION
// ===============================

const addSubtaskForm = document.getElementById("addSubtaskForm");


addSubtaskForm.addEventListener("submit", async(e) => {

    e.preventDefault();


    try {


        const formData = new FormData();


        // normal fields
        formData.append(
            "taskName",
            document.getElementById("taskName").value
        );


        formData.append(
            "description",
            document.getElementById("description").value
        );


        formData.append(
            "priorityLevel",
            document.getElementById("priorityLevel").value
        );


        formData.append(
            "statuses",
            document.getElementById("statuses").value
        );


        formData.append(
            "estimatedHours",
            document.getElementById("estimatedHours").value
        );


        formData.append(
            "startDate",
            document.getElementById("startDate").value
        );


        formData.append(
            "dueDate",
            document.getElementById("dueDate").value
        );


        formData.append(
            "isCompleted",
            document.getElementById("isCompleted").checked
        );



        // assignees
        formData.append(
            "assignees",
            document.getElementById("assigneesInput").value
        );



        // files
        subtaskFiles.forEach(file => {

            formData.append(
                "attachments",
                file
            );

        });



        const response = await fetch(
            `/api/workspaces/${workspaceIdSt}/projects/${projectIdSt}/tasks/${taskIdSt}/subtasks`,
            {
                method:"POST",
                body:formData
            }
        );


        const data = await response.json();


        if(response.ok){
            showToast(
                "Subtask added",
                "success"
            );
            setTimeout(() => {
                window.location.reload();
            }, 2000)

        }
        else{
            if(data.errors) {
                data.errors.forEach(error => {
                    showToast(error.message, "error")
                })
            } else {
                showToast(data.message, "error");
            }

        }
    }
    catch(error){
        console.log(error);
        showToast(
            "Something went wrong",
            "error"
        );

    }

});
