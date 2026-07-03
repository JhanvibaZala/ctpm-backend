export interface TaskMember {
  id: string;
  name: string;
}
export interface RawDBTask {
  id: string;
  task_name: string;
  description: string | null; // NULL if description is optional in DB
  status_id: string;
  priority_level: string | number;
  due_at: string | Date | null;
  estimated_hours: number | null;
  created_at: string | Date;
  parent_id: string | null;
  status_text: string;
  status_level: number;
  member_ids?: string | null; // Can be NULL if no members are assigned
  member_names?: string | null;
}

export interface HydratedTask extends Omit<RawDBTask, 'member_ids' | 'member_names'> {
  members?: TaskMember[];
}

export interface TaskStatus {
  id: string;
  status_text: string;
  status_level: number;
}