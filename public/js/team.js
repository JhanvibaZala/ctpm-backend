function viewMemberDetails(username) {
    fetch(`/api/workspaces/${workspaceId}/team/${username}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        },
    })
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to fetch member details");
            }

            return response.json();
        })
        .then((data) => {
            if (data.success) {
                const member = data.member[0];
                console.log(data);
                const modalContent = `
                    <div class="modal-header">

                        <h5 class="modal-title">
                            Member Details
                        </h5>

                        <button 
                            type="button" 
                            class="close-modal" 
                            onclick="document.getElementById('memberDetailsModal').classList.remove('show')">
                            &times;
                        </button>

                    </div>


                    <div class="modal-body profile-modal">


                        <div class="profile-image-container">

                            <img 
                                src="${member.profile_pic_path || '/images/default.png'}"
                                alt="${member.username}"
                                class="profile-image"
                            >

                        </div>



                        <div class="profile-details">


                            <p>
                                <strong>Name:</strong>
                                ${member.first_name} ${member.last_name}
                            </p>


                            <p>
                                <strong>Username:</strong> 
                                ${member.username}
                            </p>


                            <p>
                                <strong>Email:</strong> 
                                ${member.email_id}
                            </p>


                            <p>
                                <strong>Role:</strong> 
                                ${member.role_name}
                            </p>


                            <p>
                                <strong>Member Type:</strong>
                                ${member.member_type}
                            </p>


                        </div>


                    </div>
                `;

                document.getElementById("memberDetailsModalContent").innerHTML =
                    modalContent;

                const memberDetailsModal = document.getElementById("memberDetailsModal");

                memberDetailsModal.classList.add("show");
            } else {
                showToast(data.message || "Unable to fetch member details", "error");
            }
        })
        .catch((error) => {
            console.error(error);

            showToast("Something went wrong while fetching member details", "error");
        });
}
