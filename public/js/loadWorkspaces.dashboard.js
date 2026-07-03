async function loadWorkspaces() {
  const response = await fetch("/api/workspaces/fetchWorkspaces");

  if (!response.ok) {
    console.error("Failed to fetch workspaces");
    return;
  }

  const data = await response.json();
  // console.log(data);

  if (data.length === 0) {
    document.querySelector("#projectsGrid").innerHTML =
      "<p>No workspaces found. Create one to get started!</p>";
    return;
  } else {
    console.log("Workspaces fetched successfully:", data);
    const workspaceList = document.createElement("ul");
    data.forEach((workspace) => {
      const listItem = document.createElement("li");
      listItem.textContent = workspace.workspace_name;
      workspaceList.appendChild(listItem);
    });
    document.querySelector("#projectsGrid").appendChild(workspaceList);
  }
}

// loadWorkspaces();

function openWorkspaceDashboard(id) {
  console.log("click");
  localStorage.setItem("current_workspace", id); 
  window.location.href = "/api/workspaces/" + id + "/dashboard";
}
