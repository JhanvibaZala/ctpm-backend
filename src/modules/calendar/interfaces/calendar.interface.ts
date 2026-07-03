import { Task } from "./task.interface";

export interface PrevNext {
  year: number;
  month: number;
}

export interface TaskMap {
  [day: number]: Task[];
}