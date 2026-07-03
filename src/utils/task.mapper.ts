import { IAttachments } from "../modules/tasks/interfaces/attachments.interface";
import { ITask } from "../modules/tasks/interfaces/tasks.interface";

export function mapTask(row: any): ITask {
    return {
        id: row.id,
        projectId: row.project_id,
        parentId: row.parent_id,
        dependsOnTaskId: row.depends_on_task_id,
        taskName: row.task_name,
        description: row.description,
        statusId: row.status_id,
        priorityLevel: row.priority_level,
        estimatedHours: row.estimated_hours,
        createdAt: row.created_at,
        startDate: row.start_date,
        dueAt: row.due_at,
        completedAt: row.completed_at,
        updatedAt: row.updated_at,
        statusText: row.status_text
    }
} 

export function mapAttachment(row: any): IAttachments {
    return {
        id: row.id,
        taskId: row.taskId,
        uploadedBy: row.uploaded_by,
        fileName: row.file_name,
        filePath: row.file_path,
        fileSize: row.file_size,
        mimeType: row.mime_type,
    }
}