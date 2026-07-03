import { Request, Response } from "express";
// import { CalendarService } from "../services/calendar.service";
import { monthName } from "../utils/calendar.utils";
import { CalendarRepository } from "../repository/calendar.repository";
import { projectRepository } from "../../projects/repository/project.repository";
import { buildCalendarGrid,attachTasksToCells,prevMonth,nextMonth } from "../utils/calendar.utils";

export async function showCalendar(
  req: Request,
  res: Response
) {
  try {
    const { workspaceId, projectId }: any = req.params;

    console.log("PARAMS:", req.params);
    
    const now = new Date();

    const year =
      Number(req.query.year) ||
      now.getFullYear();

    const month =
      Number(req.query.month) ||
      now.getMonth() + 1;

    const view =
      (req.query.view as string) || "month";

    const calendarRepo =
      new CalendarRepository();

    const projectRepo =
      new projectRepository();

    const project =
      await projectRepo.getProjectById(projectId);

    const tasks =
      await calendarRepo.fetchProjectTasks(projectId);

    const weeks =
      buildCalendarGrid(year, month);

    const taskMap =
      attachTasksToCells(tasks, year, month);

    const today = {
      year: now.getFullYear(),
      month: now.getMonth() + 1,
      day: now.getDate(),
    };

    res.render("calendar/calendar", {
      workspace_id: workspaceId,
      project_id: projectId,
      project,
      tasks,
      taskMap,
      weeks,
      year,
      month,
      view,
      today,
      monthLabel: monthName(month),
      prev: prevMonth(year, month),
      next: nextMonth(year, month),
    });
  } catch (err) {
    console.log(err);
  }
}


// export async function getCalendar(req: Request, res: Response) {
//     const calendarService=new CalendarService();
//   const now = new Date();

//   const year =
//     parseInt(req.query.year as string, 10) || now.getFullYear();

//   const month =
//     parseInt(req.query.month as string, 10) || now.getMonth() + 1;

//   const projectId = (req.query.project as string) || "all";
//   const view = (req.query.view as string) || "month";

//   const data = await calendarService.getCalendarData(year, month, projectId);

//   const today = {
//     year: now.getFullYear(),
//     month: now.getMonth() + 1,
//     day: now.getDate(),
//   };

//   res.render("calendar/calendar", {
//     ...data,
//     year,
//     month,
//     view,
//     projectId,
//     today,
//     monthName,
//   });
// }

// export async function getTasksAPI(req: Request, res: Response) {
//         const calendarService=new CalendarService();

//   const now = new Date();

//   const year =
//     parseInt(req.query.year as string, 10) || now.getFullYear();

//   const month =
//     parseInt(req.query.month as string, 10) || now.getMonth() + 1;

//   const projectId = (req.query.project as string) || "all";

//   const data = await calendarService.getCalendarData(year, month, projectId);

//   res.json({
//     tasks: data.tasks,
//     weeks: data.weeks,
//     taskMap: data.taskMap,
//     year,
//     month,
//     monthLabel: data.monthLabel,
//   });
// }



export async function getTaskById(req: Request, res: Response) {

  try {

    const  id  = req.params.id as string ;
    const  projectId  = req.params.projectId as string;


    const calendarRepo =
      new CalendarRepository();


    const task =
      await calendarRepo.fetchTaskDetails(
        id,
        projectId
      );


    if (!task) {
      return res.status(404).json({
        error: "Task not found"
      });
    }


    return res.json(task);


  } catch(err){

    console.log(err);

    return res.status(500).json({
      error:"Server error"
    });

  }

}