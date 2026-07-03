//project deletion functionality

const workspace_delete_btns = document.querySelectorAll(
  ".workspace-delete-btn",
);
console.log(workspace_delete_btns);

workspace_delete_btns.forEach((btn) => {
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    const workspace_id = btn.dataset.workspaceId;
    console.log(workspace_id);

    const response = await fetch(
      "/api/workspaces/delete/" + workspace_id,
      {
        method: "delete",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );

    if (response.ok) {
      alert("workspace delete successfully");
      window.location.reload();
    } else {
      const data = await response.json();
      alert(data.msg);
    }


  });
});
