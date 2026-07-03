import { v4 as uuid } from "uuid";

/* ─────────────────────────────────────────────
   TYPES
──────────────────────────────────────────── */

export type Project = {
  id: string;
  name: string;
  color: string;
};

export type TaskStatus = "To Do" | "In Progress" | "Done";

export type TaskPriority = "Low" | "Medium" | "High" | "Urgent";

export type Task = {
  id: string;
  project_id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignees: string[];
  due_at: Date;
  start_at: Date;
};

/* ─────────────────────────────────────────────
   STATIC DATA
──────────────────────────────────────────── */

const PROJECTS: Project[] = [
  {
    id: "proj1111-0001-0001-0001-000000000001",
    name: "Mobile App v2",
    color: "#4F6EF7",
  },
  {
    id: "proj2222-0002-0002-0002-000000000002",
    name: "API Platform",
    color: "#10B981",
  },
];

/* ─────────────────────────────────────────────
   TASK SEED
──────────────────────────────────────────── */

function makeTasks(): Task[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  const base: Task[] = [
    {
      id: "task1111-0001-0001-0001-000000000001",
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "Design onboarding screen",
      status: "In Progress",
      priority: "High",
      assignees: ["carol_fe", "dave_be"],
      due_at: new Date(y, m, 8),
      start_at: new Date(y, m, 3),
    },

    {
      id: "task2222-0002-0002-0002-000000000002",
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "Implement onboarding API",
      status: "To Do",
      priority: "High",
      assignees: ["dave_be"],
      due_at: new Date(y, m, 15),
      start_at: new Date(y, m, 9),
    },

    {
      id: "task3333-0003-0003-0003-000000000003",
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "Set up CI pipeline",
      status: "Done",
      priority: "Medium",
      assignees: ["carol_fe"],
      due_at: new Date(y, m - 1, 28),
      start_at: new Date(y, m - 1, 24),
    },

    {
      id: "task4444-0004-0004-0004-000000000004",
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "Create Figma wireframes",
      status: "In Progress",
      priority: "High",
      assignees: ["carol_fe"],
      due_at: new Date(y, m, 6),
      start_at: new Date(y, m, 1),
    },

    {
      id: "task5555-0005-0005-0005-000000000005",
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "PM sign-off on wireframes",
      status: "To Do",
      priority: "Medium",
      assignees: ["carol_fe"],
      due_at: new Date(y, m, 7),
      start_at: new Date(y, m, 7),
    },

    {
      id: uuid(),
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "Push notifications spike",
      status: "To Do",
      priority: "Low",
      assignees: ["dave_be"],
      due_at: new Date(y, m, 22),
      start_at: new Date(y, m, 18),
    },

    {
      id: uuid(),
      project_id: "proj1111-0001-0001-0001-000000000001",
      title: "App Store submission",
      status: "To Do",
      priority: "Urgent",
      assignees: ["alice_dev", "carol_fe"],
      due_at: new Date(y, m + 1, 5),
      start_at: new Date(y, m, 25),
    },

    {
      id: uuid(),
      project_id: "proj2222-0002-0002-0002-000000000002",
      title: "Auth service refactor",
      status: "In Progress",
      priority: "Urgent",
      assignees: ["alice_dev"],
      due_at: new Date(y, m, 12),
      start_at: new Date(y, m, 5),
    },

    {
      id: uuid(),
      project_id: "proj2222-0002-0002-0002-000000000002",
      title: "Rate limiting middleware",
      status: "To Do",
      priority: "High",
      assignees: ["dave_be"],
      due_at: new Date(y, m, 19),
      start_at: new Date(y, m, 14),
    },

    {
      id: uuid(),
      project_id: "proj2222-0002-0002-0002-000000000002",
      title: "OpenAPI spec v2",
      status: "To Do",
      priority: "Medium",
      assignees: ["alice_dev", "bob_pm"],
      due_at: new Date(y, m, 26),
      start_at: new Date(y, m, 20),
    },

    {
      id: uuid(),
      project_id: "proj2222-0002-0002-0002-000000000002",
      title: "Load test & benchmarks",
      status: "To Do",
      priority: "Medium",
      assignees: ["dave_be"],
      due_at: new Date(y, m + 1, 10),
      start_at: new Date(y, m + 1, 6),
    },
  ];

  return base;
}

const TASKS: Task[] = makeTasks();

/* ─────────────────────────────────────────────
   PUBLIC API
──────────────────────────────────────────── */

export function getProjects(): Project[] {
  return PROJECTS;
}

export function getTasks(params?: {
  year?: number;
  month?: number;
  projectId?: string;
}): Task[] {
  let tasks = TASKS;

  const { year, month, projectId } = params || {};

  if (projectId && projectId !== "all") {
    tasks = tasks.filter((t) => t.project_id === projectId);
  }

  if (year !== undefined && month !== undefined) {
    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    tasks = tasks.filter(
      (t) =>
        (t.due_at >= start && t.due_at <= end) ||
        (t.start_at >= start && t.start_at <= end) ||
        (t.start_at <= start && t.due_at >= end)
    );
  }

  return tasks;
}

export function getTaskById(id: string): Task{
  return TASKS.find((t) => t.id === id) as Task;
}

export function getProjectById(id: string): Project | null {
  return PROJECTS.find((p) => p.id === id) || null;
}

/* Optional default export (if you prefer style compatibility) */
export default {
  getProjects,
  getTasks,
  getTaskById,
  getProjectById,
};