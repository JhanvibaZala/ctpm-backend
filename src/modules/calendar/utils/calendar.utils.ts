import { CalendarTask } from "../interfaces/task.interface";

export function buildCalendarGrid(year: number, month: number): (number | null)[][] {
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  const startDow = firstDay.getDay();
  const totalDays = lastDay.getDate();

  const cells: (number | null)[] = [];

  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let d = 1; d <= totalDays; d++) cells.push(d);

  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) {
    weeks.push(cells.slice(i, i + 7));
  }

  return weeks;
}

export function attachTasksToCells(
  tasks: CalendarTask[],
  year: number,
  month: number
) {
  const map: Record<number, CalendarTask[]> = {};
  
  tasks.forEach((task) => {
    if(!task.due_at)return;
    const d = new Date(task.due_at);
    
    if (d.getFullYear() === year && d.getMonth() === month-1) {
      const day = d.getDate();
      
      if (!map[day]) map[day] = [];
      map[day].push(task);
    }
  });
  
  return map;
}

export function monthName(month: number): string {
  return new Date(2000, month - 1, 1).toLocaleString("en-US", {
    month: "long",
  });
}

export function prevMonth(year: number, month: number) {
  return month === 1
    ? { year: year - 1, month: 12 }
    : { year, month: month - 1 };
}

export function nextMonth(year: number, month: number) {
  return month === 12
    ? { year: year + 1, month: 1 }
    : { year, month: month + 1 };
}