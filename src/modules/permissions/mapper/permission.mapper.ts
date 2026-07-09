import { RowDataPacket } from "mysql2";

export const mapPermissions = (rows: RowDataPacket[]) => {
    return rows.map(row => row.permission_name);
};