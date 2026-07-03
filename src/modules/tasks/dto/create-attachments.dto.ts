export interface CreateAttachmentDto {
    taskId: string;
    uploadedBy: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
}