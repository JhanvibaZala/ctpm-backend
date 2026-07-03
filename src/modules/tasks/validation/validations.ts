export async function validateTaskName(taskName: string) {
    if(!taskName) return {isValid: false, message: "Task name is required"};

    if(taskName.length < 2) {
        return {isValid: false, message: "Task name is too short"}
    }
    
    if(taskName.length > 50) {
        return {isValid: false, message: "Task name is too long"}
    }

    const nameRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ]['\s-]?([A-Za-zÀ-ÖØ-öø-ÿ]['\s-]?)*[A-Za-zÀ-ÖØ-öø-ÿ]$/;
    if (!nameRegex.test(taskName)) {
        return { isValid: false, message: "Task name contains invalid characters" };
    }

    return { isValid: true, message: null };
}

export async function validateStartDate(startDate: string) {
    if(!startDate) {
        return {
            isValid: false,
            message: "Start date is required"
        };
    }

    const date = new Date(startDate);

    if(isNaN(date.getTime())) {
        return {
            isValid: false,
            message: "Invalid start date"
        };
    }

    const today = new Date();

    // remove time comparison issue
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    if(date < today) {
        return {
            isValid: false,
            message: "Start date cannot be in the past"
        };
    }

    return {
        isValid: true,
        message: null
    };
}

export async function validateDueDate(
    dueDate: string,
    startDate: string
) {
    if(!dueDate) {
        return {
            isValid: false,
            message: "Due date is required"
        };
    }

    const due = new Date(dueDate);

    if(isNaN(due.getTime())) {
        return {
            isValid: false,
            message: "Invalid due date"
        };
    }

    if(startDate) {
        const start = new Date(startDate); 
        if(due < start) {
            return {
                isValid: false,
                message: "Due date cannot be before start date"
            };
        }
    }

    return {
        isValid: true,
        message: null
    };
}

export async function validateEstimatedHours(estimatedHours: string) {
    if(!estimatedHours) {
        return {
            isValid: false,
            message: "Estimated hours are required"
        };
    }

    const hours = Number(estimatedHours);
    if(isNaN(hours)) {
        return {
            isValid: false,
            message: "Estimated hours must be a number"
        };
    }

    if(hours <= 0) {
        return {
            isValid: false,
            message: "Estimated hours must be greater than 0"
        };
    }

    if(hours > 1000) {
        return {
            isValid: false,
            message: "Estimated hours are too high"
        };
    }

    return {
        isValid: true,
        message: null
    };

}

export async function validateDescription(description: string) {
    // If description is optional
    if(!description || description.trim() === "") {
        return {
            isValid: true,
            message: null
        };
    }

    description = description.trim();
    if(description.length < 5) {
        return {
            isValid: false,
            message: "Description is too short"
        };
    }

    if(description.length > 500) {
        return {
            isValid: false,
            message: "Description is too long"
        };
    }

    return {
        isValid: true,
        message: null
    };
}

export async function validateAttachments(attachments:any[]) {
    if(!attachments || attachments.length === 0){
        return {
            isValid:true,
            message:null
        };
    }

    const allowedExtensions = [
        ".pdf",
        ".xlsx",
        ".xls",
        ".csv",
        ".png",
        ".jpg",
        ".jpeg",
        ".webp"
    ];


    for(const file of attachments){
        const extension = file.originalname
            .substring(file.originalname.lastIndexOf("."))
            .toLowerCase();
        if(!allowedExtensions.includes(extension)){
            return {
                isValid:false,
                message:`${file.originalname} is not supported`
            };

        }
    }
    
    return {
        isValid:true,
        message:null
    };

}