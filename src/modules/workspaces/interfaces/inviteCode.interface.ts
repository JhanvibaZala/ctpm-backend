export interface CreateInviteCode {
    id: string;
    workspaceId: string;
    inviteCode: string;
    createdBy: string;
    maxUses: number;
    expiresAt: Date;
}
export interface InviteCode {
    id: string;
    workspaceId: string;
    inviteCode: string;
    createdBy: string;
    isActive: boolean;
    maxUses: number;
    usedCount: number;
    expiresAt: Date;
    createdAt: Date;
}