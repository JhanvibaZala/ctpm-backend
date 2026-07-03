import { RowDataPacket } from "mysql2";
import db from "../../../config/dbconfig";

interface DashboardRow extends RowDataPacket {
  dashboard: {
    status: {
      Pending: number;
      WIP: number;
      "On Hold": number;
      Completed: number;
    };
    urgency: {
      Low: number;
      Medium: number;
      High: number;
      Urgent: number;
    };
  };
}

export class WorkspaceRepo {
    async fetchWorkspaceStats(workspace_id: string) {
        const query = `SELECT JSON_OBJECT(
                        'status', JSON_OBJECT(
                        'Pending', SUM(status = 'Pending'),
                        'WIP', SUM(status = 'WIP'),
                        'On Hold', SUM(status = 'On Hold'),
                        'Completed', SUM(status = 'Completed')
                        ),
                        'urgency', JSON_OBJECT(
                        'Low', SUM(priority_level = 'Low'),
                        'Medium', SUM(priority_level = 'Medium'),
                        'High', SUM(priority_level = 'High'),
                        'Urgent', SUM(priority_level = 'Urgent')
                        )
                        ) AS dashboard
                        FROM projects
                        WHERE workspace_id = ?;`

        const values = [workspace_id]
        const [rows] = await db.execute<DashboardRow[]>(query, values)
        const stats = rows[0]?.dashboard
        return stats
    }

    async fetchWorkspaceInfo(workspace_id: string) {
        const query = `SELECT workspace_name, description FROM workspaces where id = ?`
        const values = [workspace_id]
        const [rows] = await db.execute<RowDataPacket[]>(query, values)
        return rows[0]
    }
}