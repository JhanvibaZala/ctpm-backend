// import store from "../data/store";
// import {
//   buildCalendarGrid,
//   attachTasksToCells,
//   monthName,
//   prevMonth,
//   nextMonth,
// } from "../utils/calendar.utils";

// export class CalendarService {
    

// async getCalendarData(year: number, month: number, projectId: string){
//     const projects = store.getProjects();
//     const tasks = store.getTasks({ year, month, projectId });

//     const weeks = buildCalendarGrid(year, month);
//     const taskMap = attachTasksToCells(tasks, year, month);

//     const projectColors: Record<string, string> = {};
//     projects.forEach((p) => {
//       projectColors[p.id] = p.color;
//   });

//   return {
//     projects,
//     tasks,
//     weeks,
//     taskMap,
//     projectColors,
//     monthLabel: monthName(month),
//     prev: prevMonth(year, month),
//     next: nextMonth(year, month),
//   };
// }
// }