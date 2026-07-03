import { Request, Response } from "express";
import { GanttRepository } from "../repository/gantt.repository";
import { projectRepository } from "../../projects/repository/project.repository";

export async function showGanttPage(req: Request, res: Response) {
  try {
    return res.render("gantt_chart/gantt_chart");
  } catch (err) {
    console.log(err);
    return res.send(
      "Something went wrong while trying to fetch the page you request for",
    );
  }
}

export async function showGanttChart(req: Request, res: Response) {
  try {
    const { workspaceId, projectId }: any = req.params;

    const ganttRepository = new GanttRepository();
    const projectRepo = new projectRepository();
    const project_obj = await projectRepo.getProjectById(projectId);
    console.log(project_obj);
    const project_tasks = await ganttRepository.fetchProjectTasks(projectId);
    const project_statuses =
      await ganttRepository.fetchProjectStatuses(projectId);

    return res.render("gantt_chart/gantt_chart", {
      project_id: projectId,
      workspace_id: workspaceId,
      project_tasks,
      project_statuses,
      project:project_obj
    });
  } catch (err) {
    console.log(err);
    return res.render("gantt_chart/gantt_chart", {
      err: "an error occurred while trying to create gantt chart for this project, pls try again later or check the project id.",
    });
  }
}
