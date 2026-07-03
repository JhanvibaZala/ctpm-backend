//project deletion functionality

const project_delete_btns = document.querySelectorAll(".project-delete-btn");
console.log(project_delete_btns);

project_delete_btns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const project_id = btn.dataset.projectId;
    console.log(project_id);

    const response = await fetch(
      "/api/workspaces/:workspaceId/projects/" + project_id + "/delete",
      {
        method: "delete",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.ok) {
      alert("project delete successfully");
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.msg);
    }
  });
});

//onclick project card event to open tasks

function handleProjectCardClick(workspace_id, project_id) {
  window.location.href = `/api/workspaces/${workspace_id}/projects/${project_id}/tasks`;

  //store task link to localstorage to remember the workspace_id and project_id to access the task
  localStorage.setItem(
    "task_link",
    `/api/workspaces/${workspace_id}/projects/${project_id}/tasks`,
  );
}

//edit project functionality

const project_edit_buttons = document.querySelectorAll(".project-edit-btn");
project_edit_buttons.forEach(async (editBtn) => {
  editBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const project_id = editBtn.dataset.projectId; 
    console.log(project_id);

    const response = await fetch(
      window.location.href + "/" + project_id + "/getProject",
    );

    if (response.ok) {
      const data = await response.json();
      console.log(data);
      setFormValues(data.projectData,data.projectManager)
      openProjectModal("edit",project_id);
    } else {
      console.log(response);
    }
  });
});

function setFormValues(data,projectManager) {
  document.getElementById("pName").value = data.project_name;
  document.getElementById("pDesc").value = data.description;
  document.getElementById("pStatus").value = data.status;
  document.getElementById("pPriority").value = data.priority_level;
  document.getElementById("pVisibility").value = data.visibility;
  document.getElementById("pLead").value = projectManager.email_id;
}
