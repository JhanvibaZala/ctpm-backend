let selectedTaskId = null;

function openDeleteModal(taskId){


    selectedTaskId = taskId;


    document.getElementById("deleteModal")
    .style.display = "flex";


}

function closeDeleteModal(){


    selectedTaskId = null;


    document.getElementById("deleteModal")
    .style.display = "none";


}

let workspaceId = document.getElementById("workspaceId").value;
let projectId = document.getElementById("projectId").value;

async function deleteTask(){
    try{
        const response = await fetch(
            `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${selectedTaskId}`,
            {
                method:"DELETE"
            }
        );

        const data = await response.json();
        if(!response.ok){

            showToast(data.message,"error");

            return;

        }
        if(response.ok){
            showToast(data.message,"success");
            setTimeout(()=>{
                document.referrer 
                ? 
                window.location.href = document.referrer 
                : 
                window.location.href =
                `/api/workspaces/${workspaceId}/projects/${projectId}/tasks`;
            },1500);
        }
        else{
            alert(data.message);
        }
    }
    catch(error){
        console.log(error);
    }
}



// edit things =======================================

async function openEditTaskModal(taskId){
    console.log("in open edit form", taskId)
    document.getElementById(
        "editTaskModal"
    ).style.display="flex";
    
    selectedTaskId = taskId;
    // get the task details and populate the form
    const data = await fetch(`/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}/edit-data`,{
        method:"GET"
    });
    
    const dataChunck = await data.json();
    
    if(!data.ok){
        showToast(taskData.message,"error");
        return;
    } else {
        populateEditForm(dataChunck);
    }
}




populateEditForm = (data) => {
    console.log("in populate edit form", taskId)
    let task = data.task;
    document.getElementById("editTaskName").value = task.taskName || "";
    document.getElementById("editTaskDescription").value = task.description || "";
    console.log(task.startDate);  
    if(task.startDate){
        let startDate = new Date(task.startDate);
        document.getElementById("editStartDate").value = new Date(task.startDate).toISOString().split("T")[0];
        document.getElementById("editStartDateText").innerText = new Date(task.startDate).toDateString();
    } else {
        document.getElementById("editStartDate").value = "";
        
        document.getElementById("editStartDateText").innerText =
        "No start date";
    }
    if(task.dueAt){
        let dueDate = new Date(task.dueAt);
        document.getElementById("editDueDate").value = new Date(task.dueAt).toISOString().split("T")[0];
        document.getElementById("editDueDateText").innerText = new Date(task.dueAt).toDateString();
    } else {
        document.getElementById("editDueDate").value = "";
        
        document.getElementById("editDueDateText").innerText =
        "No due date";
    }
    
    document.getElementById("editPriority").value = task.priorityLevel || "Medium";
    
    // populate STATUSES if needed
    // console.log("data====================")
    // const findStatus = task.completedAt
    let statuses = data.statuses;
    console.log("statuses");   
    console.log(statuses);
    statuses.forEach(status => {
        const option = document.createElement("option");
        option.value = status.id;
        option.text = status.status_text;
        if(status.id === task.statusId){
            option.selected = true;
        }
        document.getElementById("editStatus").appendChild(option);
    })
    
    document.getElementById("editEstimatedHours").value = task.estimatedHours || "";
    document.getElementById("editCompleted").checked = task.completedAt ? true: false;
    
    populateAssignees(data);  
    
    populateExistingFiles(data.attachments);
}

let selectedUsers = [];
let allUsers = [];
function populateAssignees(data){
    console.log("populate data ")
    console.log(data)
    
    selectedUsers = [...data.selectedAssignees]
    
    allUsers = [...data.assignees]
    
    
    renderSelectedAssignees();
}

const search =
document.getElementById("editAssigneeSearch");

const dropdown =
document.getElementById("editAssigneeDropdown");

search.addEventListener("input",()=>{
    
    if(allUsers.length == 0) {
        return;
    }
    
    const value = search.value.toLowerCase();
    
    
    dropdown.innerHTML="";
    
    
    if(value.length < 1){
        
        dropdown.style.display="none";
        return;
        
    }
    
    
    
    const filtered = allUsers.filter(user=>{
        
        
        return user.username
        .toLowerCase()
        .includes(value);
        
        
    });
    
    
    
    filtered.forEach(user=>{
        
        
        const div=document.createElement("div");
        
        
        div.className="assignee-option";
        
        
        div.innerText=user.username;
        
        
        
        div.onclick=()=>{
            
            addEditAssignee(user);
            
        };
        
        
        dropdown.appendChild(div);
        
        
    });
    
    
    
    dropdown.style.display="block";
    
    
});

function removeEditAssignee(id){
    
    
    selectedUsers = selectedUsers.filter(
        user=>user.id !== id
    );
    
    
    renderSelectedAssignees();
    
}
function addEditAssignee(user){


    const exists = selectedUsers.some(
        u=>u.id === user.id
    );


    if(exists){
        return;
    }


    selectedUsers.push(user);


    renderSelectedAssignees();


    search.value="";

    dropdown.style.display="none";

}

// render selected users chips
function renderSelectedAssignees(){

        const container = document.getElementById(
            "editSelectedAssignees"
        );


        const hiddenInput = document.getElementById(
            "editAssigneesInput"
        );


        container.innerHTML="";


        selectedUsers.forEach(user=>{


            const chip = document.createElement("div");

            chip.className="assignee-chip";


            chip.innerHTML = `

                ${user.username}

                <span onclick="removeEditAssignee('${user.id}')">
                    ×
                </span>

            `;


            container.appendChild(chip);

        });



        // send ids to backend

        hiddenInput.value = selectedUsers
            .map(user=>user.id)
            .join(",");

    }



// ============================= files
const fileInput = document.getElementById("editAttachments");
const fileList = document.getElementById("editFileList");

let selectedFiles = [];
let existingFiles = [];
let deletedFiles = [];

function populateExistingFiles(files){

    existingFiles = files;

    const fileList =
        document.getElementById("editFileList");
    fileList.innerHTML="";

    existingFiles.forEach(file=>{
        const div = document.createElement("div");
        div.className="file-item existing-file";
        div.innerHTML = `
            <span>
                ${file.fileName}
            </span>
            <a 
              href="/${file.filePath}"
              target="_blank"
            >
                View
            </a>
            <i 
              class="fa-solid fa-xmark"
              onclick="removeExistingFile('${file.id}')"
            ></i>

        `;
        fileList.appendChild(div);
    });

}

function removeExistingFile(id){
    deletedFiles.push(id);

    existingFiles = existingFiles.filter(
        file=>file.id !== id
    );
    
    renderAllFiles();
    document.getElementById("deletedFiles").value = deletedFiles.join(",");
}

fileInput.addEventListener("change",(event)=>{
    const files = Array.from(event.target.files);
    selectedFiles = [
        ...selectedFiles,
        ...files
    ];
    renderAllFiles();
    
    fileInput.value="";
});

function displayNewFiles(){
    // const fileList =
    // document.getElementById("editFileList");

    // selectedFiles.forEach((file,index)=>{
    //     const div =
    //     document.createElement("div");
    //     div.className="file-item new-file";
    //     div.innerHTML=`

    //         <span>
    //             ${file.name}
    //         </span>


    //         <i 
    //         class="fa-solid fa-xmark"
    //         onclick="removeNewFile(${index})">
    //         </i>

    //     `;
    //     fileList.appendChild(div);
    // });
    renderAllFiles();
}

function removeNewFile(index){
    selectedFiles.splice(index,1);
    renderAllFiles();
}

function renderAllFiles(){
    const fileList =
    document.getElementById("editFileList");

    fileList.innerHTML="";

    // old files
    existingFiles.forEach(file=>{
        fileList.innerHTML += `
        <div class="file-item existing-file">
            <span>${file.fileName}</span>
            <a href="/${file.filePath}" target="_blank">
                View
            </a>        
            <i 
            onclick="removeExistingFile('${file.id}')"
            class="fa-solid fa-xmark">
            </i>

        </div>

        `;

    });

    // new files
    selectedFiles.forEach((file,index)=>{
        fileList.innerHTML += `
        <div class="file-item">
            ${file.name}
            <i 
            onclick="removeNewFile(${index})"
            class="fa-solid fa-xmark">
            </i>

        </div>

        `;
    });
}

function closeEditTaskModal(){

    document.getElementById(
        "editTaskModal"
    ).style.display="none";

}


const startDate = document.getElementById("editStartDate");
const startDateText = document.getElementById("editStartDateText");

startDate.addEventListener("change",()=>{

    if(startDate.value){

        const date = new Date(startDate.value);

        startDateText.innerText = date.toDateString();

    }
    else{

        startDateText.innerText="No start date";

    }

});

const dueDate = document.getElementById("editDueDate");
const dueDateText = document.getElementById("editDueDateText");

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
function openEditStartDatePicker(){

    const input = document.getElementById("editStartDate");

    if(input.showPicker){
        input.showPicker();
    }
    else{
        input.click();
    }

}

function openEditDueDatePicker(){

    const input = document.getElementById("editDueDate");

    if(input.showPicker){
        input.showPicker();
    }
    else{
        input.click();
    }

}


const taskId = document.getElementById("taskId").value;
console.log("taskId :", taskId)
console.log("workspce :", workspaceId)
console.log("pr :", projectId)
// controlling form submission
document.getElementById("editTaskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const url = `/api/workspaces/${workspaceId}/projects/${projectId}/tasks/${taskId}`

    const formData = new FormData();

    // normal fields

    formData.append(
        "taskName",
        document.getElementById("editTaskName").value
    );


    formData.append(
        "description",
        document.getElementById("editTaskDescription").value
    );


    formData.append(
        "startDate",
        document.getElementById("editStartDate").value
    );


    formData.append(
        "dueDate",
        document.getElementById("editDueDate").value
    );


    formData.append(
        "priorityLevel",
        document.getElementById("editPriority").value
    );


    formData.append(
        "statusId",
        document.getElementById("editStatus").value
    );


    formData.append(
        "estimatedHours",
        document.getElementById("editEstimatedHours").value
    );


    formData.append(
        "completed",
        document.getElementById("editCompleted").checked
    );



    // assignees

    let assignees =
        document.getElementById("editAssigneesInput").value;


    formData.append(
        "assignees",
        assignees
    );



    // deleted old files

    formData.append(
        "deletedFiles",
        document.getElementById("deletedFiles").value
    );



    // new files

    selectedFiles.forEach(file=>{

        formData.append(
            "attachments",
            file
        );

    });


    const response = await fetch (url, {
        method: "PATCH",
        body: formData
    })
    const data = await response.json();
    if(response.ok) {
        showToast("Task updated successfully", "success"),
        
        setTimeout(() => {
            location.reload();
        },1000)
        
    } else {
        if(data.errors) {
            data.errors.forEach(error => {
                showToast(error.message, "error")
            })
        } else {
            showToast("Failed to update task!", "error");
        }
        return;
    }
})