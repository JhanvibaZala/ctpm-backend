import { Request, Response } from "express";
import { BurnupBurndownRepository } from "../repository/burnup_burndown.repository";

const repo = new BurnupBurndownRepository();
const TEMPLATE = "burnup_burndown/burnup_burndown"; // single source of truth

function formatDate(date: Date): string {
    return date.toISOString().split("T")[0] as string; // YYYY-MM-DD for map key
}

function friendlyDate(date: Date): string {
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function buildDateRange(start: Date, end: Date): string[] {
    const dates: string[] = [];
    const current = new Date(start);
    current.setHours(0, 0, 0, 0);
    const endNorm = new Date(end);
    endNorm.setHours(0, 0, 0, 0);
    while (current <= endNorm) {
        dates.push(formatDate(current));
        current.setDate(current.getDate() + 1);
    }
    return dates;
}

const emptyRender = (res: Response, overrides: Record<string, any> = {}) =>
    res.render(TEMPLATE, {
        project: null,
        labels: [],
        burnupData: [],
        burndownData: [],
        idealData: [],
        totalTasks: 0,
        error: null,
        ...overrides,
    });

export async function getPage(req: Request, res: Response) {
    return emptyRender(res);
}

export async function generateCharts(req: Request, res: Response) {
    try {
    const { workspaceId, projectId }: any = req.params;


        if (!projectId?.trim()) {
            return emptyRender(res, { error: "Project ID is required." });
        }

        const project = await repo.getProjectById(projectId);

        if (!project) {
            return emptyRender(res, { error: `No project found for ID: ${projectId}` });
        }

        // burnup_burndown.controller.ts — replace inside generateCharts()

        const [totalTasks, completedRows, earliestTask] = await Promise.all([
            repo.getTotalTasks(projectId),
            repo.getCompletedTasksByDate(projectId),
            repo.getEarliestTaskDate(projectId),   // new repo method below
        ]);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Start from whichever is earliest: project created_at or first task start_date
        const rangeStart = earliestTask && earliestTask < project.created_at
            ? earliestTask
            : project.created_at;


        const lastRow = completedRows[completedRows.length - 1];
        const lastCompletionDate = lastRow?.date ? new Date(lastRow.date) : today;

        // End at whichever is latest: today, deadline, or last completion date
        // const lastCompletionDate = completedRows.length
        //     ? new Date(completedRows[completedRows.length - 1].date)
        //     : today;

        const candidates = [today, lastCompletionDate];
        if (project.deadline_at) candidates.push(project.deadline_at);
        const rangeEnd = new Date(Math.max(...candidates.map(d => d.getTime())));

        const dateRange = buildDateRange(rangeStart, rangeEnd);

        // ── Completion map: YYYY-MM-DD → count that day ───────────────────────
        const completionMap = new Map<string, number>();
        completedRows.forEach((r) => {
            completionMap.set(r.date, Number(r.completed_count));
        });

        // ── Burn-up: cumulative tasks completed ───────────────────────────────
        let cumulative = 0;
        const burnupData: number[] = [];
        dateRange.forEach((date) => {
            cumulative += completionMap.get(date) || 0;
            burnupData.push(cumulative);
        });

        // ── Burn-down: remaining tasks ────────────────────────────────────────
        const burndownData = burnupData.map((completed) => totalTasks - completed);

        // ── Ideal burn-down: linear from totalTasks on day 0 → 0 on deadline ─
        // replace the idealData block in the controller

        const deadlineDate = project.deadline_at ?? rangeEnd;
        const deadlineIndex = dateRange.findIndex(d => d === formatDate(deadlineDate));
        // if deadline is before rangeEnd, use that index; otherwise use last index
        const idealEndIndex = deadlineIndex !== -1 ? deadlineIndex : dateRange.length - 1;

        const idealData = dateRange.map((_, i) => {
            if (i >= idealEndIndex) return 0;
            return parseFloat((totalTasks - (totalTasks / idealEndIndex) * i).toFixed(2));
        });

        // ── Human-readable labels for Chart.js x-axis ─────────────────────────
        const labels = dateRange.map((d) => friendlyDate(new Date(d)));

        return res.render(TEMPLATE, {
            project,
            labels,
            burnupData,
            burndownData,
            idealData,
            totalTasks,
            error: null,
            project_id:projectId,
            workspace_id:workspaceId
        });

    } catch (err) {
        console.error(err);
        return emptyRender(res, {
            error: "Something went wrong while generating the charts. Please try again.",
        });
    }
}
 