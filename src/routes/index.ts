import registerRouter from "../modules/auth/routes/register.router";
import { Router } from "express";
import authRouter from "../modules/auth/routes/auth.router";
import dashboardRouter from "../modules/dashboard/routes/dashboard.router";
import workspacesRouter from "../modules/workspaces/routes/workspaces.router";
import projectRouter from "../modules/projects/routes/project.router";
import myProjectRouter from "../modules/projects/routes/myProject.router";
import authMiddleware from "../middlewares/auth.middleware";
import projectStatusSync from "../middlewares/projectSync.middleware";
import loginRouter from "../modules/auth/routes/login.router";
import forgotPasswordRouter from "../modules/auth/routes/forgotPassword.router";
import otpRouter from "../modules/auth/routes/otp.router";
import userRouter from "../modules/user/routes/user.router";
import resetPasswordRouter from "../modules/auth/routes/resetPassword.router";
import taskRouter from "../modules/tasks/routes/tasks.router";
import { createCommentRouter } from "../modules/tasks/routes/comments.routes";
import { errorHandler } from "../middlewares/error.middleware";

import kanbanRouter from "../modules/kanban/routes/kanban.routes";
import ganttRouter from "../modules/gantt_chart/routes/gantt.routes";
import calendarRouter from "../modules/calendar/routes/calendar.router";
import burnUpBurnDownRouter from "../modules/burnup_burndown/routes/burnup_burndown.routes";


import { Pool } from "mysql2/promise"; // Ensure you import your type
import { loadWorkspacePermissions } from "../middlewares/loadWorkspacePermissions";
import { checkWorkspaceMembership } from "../middlewares/checkWorkspaceMembership.middleware";

// Wrap your central router inside an initialization factory
export function createMasterRouter(
  db: Pool,
  deps: {
    wsPush: (userId: string, event: object) => void;
    enqueueEmail: (data: object) => Promise<void>;
    enqueueSlack: (data: object) => Promise<void>;
  },
): Router {
  const router = Router();

  // router.use('/', authMiddleware, kanbanRouter)

  router.get("/", (req, res) => {
    res.redirect("/register");
  });

  router.use("/api/register", registerRouter);
  router.use("/api/login", loginRouter);
  router.use("/api/forgot-password", forgotPasswordRouter);
  router.use("/api/reset-password", resetPasswordRouter);
  router.use("/api/otp", otpRouter);
  router.use("/api/auth", authRouter);
  router.use("/api/dashboard", authMiddleware, dashboardRouter); // add middleware here later to protect this route
  router.use(
    "/api/workspaces",
    authMiddleware,
    loadWorkspacePermissions,
    workspacesRouter,
  ); // add middleware here later to protect this route


  // gets current logged in user
  router.use("/api/me", authMiddleware, userRouter);


  router.use(
    "/api/workspaces/:workspaceId/projects",
    authMiddleware,
    checkWorkspaceMembership,
    loadWorkspacePermissions,
    projectRouter,
  );

  router.use(
    "/api/workspaces/:workspaceId/projects/:projectId/tasks",
    authMiddleware,
    checkWorkspaceMembership,
    loadWorkspacePermissions,
    taskRouter,
  );

  // for all projects 
  router.use(
    "/api/projects",
    authMiddleware,
    myProjectRouter
  );
  router.use(
    "/api/workspaces/:workspaceId/projects/:projectId/kanban",
    authMiddleware,
    projectStatusSync,
   
    kanbanRouter,
  );
  router.use(
    "/api/workspaces/:workspaceId/projects/:projectId/gantt",
    authMiddleware,
   
    ganttRouter,
  );
  router.use(
    "/api/workspaces/:workspaceId/projects/:projectId/burnChart",
    authMiddleware,
   
    burnUpBurnDownRouter,
  );

  router.use(
    "/api/workspaces/:workspaceId/projects/:projectId/calendar",
    authMiddleware,
   
    calendarRouter,
  );

  // router.use("/gantt", ganttRouter);
  // router.use("/bubd", burnUpBurnDownRouter);

  // Pass infrastructure dependencies down into your comments engine
  // please follow the standard route for comments
  router.use(
    "/tasks/:taskId/comments",
   
    createCommentRouter(db, deps),
  );

  router.use(errorHandler);
  return router;
}
