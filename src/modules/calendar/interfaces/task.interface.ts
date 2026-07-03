import { RowDataPacket } from "mysql2";

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: string;
  priority: string;
  assignees: string[];
  due_at: Date;
  start_at: Date;
}




export interface CalendarTask extends RowDataPacket {
    id: string;
    project_id: string;
    task_name: string;

    description: string | null;

    status_id: number;
    status_text:string;

    priority_level:
      | "Low"
      | "Medium"
      | "High"
      | "Urgent";

    start_date: Date | null;

    due_at: Date | null;

    completed_at: Date | null;
}