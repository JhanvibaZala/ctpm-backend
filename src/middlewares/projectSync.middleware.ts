'use strict';

import { string } from 'yup';
import {kanbanService} from '../modules/kanban/service/kanban.service';
import { Request, Response, NextFunction } from 'express';

/**
 * projectStatusSync middleware
 * ----------------------------
 * Recalculates and persists a project's `status` column based on the
 * completion state of its ROOT tasks (parent_id IS NULL, not deleted):
 *
 *   - 0 root tasks              -> 'Pending'
 *   - all root tasks completed  -> 'Completed' (always, overrides current status)
 *   - not all completed         -> 'Pending' ONLY IF current status was 'Completed'
 *                                  (WIP / On Hold are left untouched)
 *
 * Usage:
 *   - On GET  (board render): mount BEFORE the controller, so the page
 *     reflects the freshest project.status.
 *   - On PATCH (task move):    mount AFTER the controller's DB write, so
 *     the sync sees the just-updated completed_at value.
 *
 * Expects :workspaceId and :projectId route params (mergeParams: true on the router).
 * Attaches the resolved status to res.locals.syncedProjectStatus for any
 * downstream handler that wants it (e.g. to include in a JSON response).
 */
async function projectStatusSync(req:Request, res:Response, next:NextFunction) {
  try {
    const projectId  = (req.params.projectId) as string;
  
 const kanbanSer = new kanbanService()
    if (!projectId) return next();

    const syncedStatus = await kanbanSer.syncProjectStatus(projectId);
    res.locals.syncedProjectStatus = syncedStatus; // null if no change was made

    return next();
  } catch (err) {
    console.error('[projectStatusSync] failed:', err);
    // Non-fatal: don't block the request over a sync hiccup
    return next();
  }
}

 export default projectStatusSync;