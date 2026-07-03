export interface ICreateAttachments {
    id: string;
    taskId: string;
    uploadedBy: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
}

export interface IAttachments {
    id: string;
    taskId: string;
    uploadedBy: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    mimeType: string;
}

export interface IUpdateAttachments {
    id: string,
    taskId: string,
    uploadedBy: string,
    fileName: string,
    filePath: string,
    fileSize: number,
    mimeType: string,
}

export interface IDeleteAttachments {
    id: string,
    taskId: string,
}
