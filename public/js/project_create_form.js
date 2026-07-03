const modal = document.getElementById("projectModal");
const projectForm = document.getElementById("projectForm")
async function openProjectModal(openType,project_id) {
  //load team member
  await loadTeamMembers();
  // Set default dates to today and +1 week for demo
  const today = new Date().toISOString().split("T")[0];
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 7);

  if(openType=="create"){
  document.getElementById("pName").value = ""
  document.getElementById("pDesc").value = ""
  document.getElementById("pDesc").value = ""
  document.getElementById("pStart").value = today;
  document.getElementById("pEnd").value = nextWeek.toISOString().split("T")[0];
  document.getElementById("project-add-edit-btn").innerText = "Create Project"
  }else{
  document.getElementById("project-add-edit-btn").innerText = "Edit Project"
  projectForm.action = window.location.href + `/${project_id}/update`
  }

  modal.style.display = "flex";
}

function closeProjectModal() {
  modal.style.display = "none";
}

// Close on outside click
window.onclick = function (event) {
  if (event.target === modal) {
    closeProjectModal();
  }
};

function handleCreate(e) {
  e.preventDefault();

  const projectData = {
    name: document.getElementById("pName").value,
    description: document.getElementById("pDesc").value,
    status: document.getElementById("pStatus").value,
    priority: document.getElementById("pPriority").value,
    startDate: document.getElementById("pStart").value,
    endDate: document.getElementById("pEnd").value,
    lead: document.getElementById("pLead").value,
  };

  console.log("Creating Project:", projectData);
  alert(`Project "${projectData.name}" created successfully!`);

  document.getElementById("projectForm").reset();
  closeProjectModal();
}

// load invite team member in create project form

async function loadTeamMembers() {
  const response = await fetch(window.location.href + "/getinvitemember");

  if (response.ok) {
    const data = await response.json();
    // console.log(data.teamList);
    const teamList = data.teamList;

    const selectTeam = document.getElementById("team-member");

    let teamlistHtml = "";

    for (let i = 0; i < teamList.length; i++) {
      teamlistHtml += `
            <option value='${teamList[i].id}'> 
            ${teamList[i].first_name} 
            ${teamList[i].last_name} 
            (@${teamList[i].username})
            </option>`;
    }

    selectTeam.innerHTML += teamlistHtml;
  }else{
    console.log(response);
  }
}

// select member frontend  functionality
const memberSelect = document.getElementById("team-member");
const selectedMembersDiv = document.getElementById("selectedMembers");
const teamMembersInput = document.getElementById("teamMembersInput");

let selectedMembers = [];

memberSelect.addEventListener("change", function () {
  const selectedOption = this.options[this.selectedIndex];
  const memberId = selectedOption.value;
  const memberText = selectedOption.text.trim();

  // Prevent duplicate or empty selection
  if (!memberId || selectedMembers.some((m) => m.id === memberId)) {
    this.value = "";
    return;
  }

  // Store both id and text
  selectedMembers.push({ id: memberId, text: memberText });

  const tag = document.createElement("span");
  tag.className = "team-tag";
  tag.innerHTML = `
        ${memberText}
        <button type="button" class="remove-member">×</button>
    `;

  selectedMembersDiv.appendChild(tag);

  updateHiddenInput();

  tag.querySelector(".remove-member").addEventListener("click", () => {
    selectedMembers = selectedMembers.filter((m) => m.id !== memberId);
    tag.remove();
    updateHiddenInput();
  });

  this.value = "";
});

function updateHiddenInput() {
  // Only store IDs in hidden input
  teamMembersInput.value = JSON.stringify(selectedMembers.map((m) => m.id));
}


//allow tasks status//

// Array to store status objects
let taskStatuses = [{text : "Pending",level : "2"},{text : "In Progress",level : "5"},{text : "Completed",level : "10"}];
renderList()
document.getElementById("taskStatusesInput").value = JSON.stringify(taskStatuses);


function addTaskStatus() {
  const textInput = document.getElementById("newStatusText");
  const levelInput = document.getElementById("newStatusLevel");
  const listContainer = document.getElementById("taskStatusList");
  const hiddenInput = document.getElementById("taskStatusesInput");

  const statusText = textInput.value.trim();
  const statusLevel = levelInput.value;

  if (!statusText) {
    alert("Please enter a status text.");
    return;
  }

  // Add to array
  const newStatus = { text: statusText, level: statusLevel };
  taskStatuses.push(newStatus);

  // Update Hidden Input with JSON string
  hiddenInput.value = JSON.stringify(taskStatuses);

  // Create Visual Tag
  const tag = document.createElement("span");
  tag.className = "badge badge-info m-1 p-2 border"; // Adjust classes based on your CSS framework (e.g., Bootstrap)
  tag.style.backgroundColor = getLevelColor(statusLevel);
  tag.style.color = "#fff";
  tag.innerHTML = `
            ${statusText} <small>(${statusLevel})</small>
            <button type="button" onclick="removeTaskStatus(${taskStatuses.length - 1})" style="background:none; border:none; color:white; font-weight:bold; cursor:pointer; margin-left:5px;">&times;</button>
        `;

  listContainer.appendChild(tag);

  // Clear input
  textInput.value = "";
  textInput.focus();
}

function removeTaskStatus(index) {
  // Remove from array
  taskStatuses.splice(index, 1);

  // Update Hidden Input
  document.getElementById("taskStatusesInput").value =
    JSON.stringify(taskStatuses);

  // Re-render list
  renderList();
}

function renderList() {
  const listContainer = document.getElementById("taskStatusList");
  listContainer.innerHTML = ""; // Clear current list

  taskStatuses.forEach((status, index) => {
    const tag = document.createElement("span");
    tag.className = "badge badge-info m-1 p-2 border";
    tag.style.backgroundColor = getLevelColor(status.level);
    tag.style.color = "#fff";
    tag.innerHTML = `
                ${status.text} <small>(${status.level})</small>
                <button type="button" onclick="removeTaskStatus(${index})" style="background:none; border:none; color:white; font-weight:bold; cursor:pointer; margin-left:5px;">&times;</button>
            `;
    listContainer.appendChild(tag);
  });
}

// Helper to assign colors based on level
function getLevelColor(level) {
    console.log(level)
  switch (level) {
    case "2":
    case "3":
      return "#17a2b8"; // Blue
    case "4":
    case "5":
    case "6":
      return "#ffc107"; // Yellow (text might need to be dark)
    case "7":
    case "8":
      return "#fd7e14"; // Orange
    case "9":
    case "10":
      return "#dc3545"; // Red
    default:
      return "#6c757d";
  }
}
