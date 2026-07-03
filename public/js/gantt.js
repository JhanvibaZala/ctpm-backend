const STATUS = Object.fromEntries(
    RAW_STATUS.map(s => [s.id, s.status_text])
);

const TASKS = RAW.map(t => ({
    ...t,
    start_date: new Date(t.start_date),
    due_at: t.due_at ? new Date(t.due_at) : null,
    completed_at: t.completed_at ? new Date(t.completed_at) : null,
}));

const DAY_WIDTH = 42;

const palette = [
    ["#e8e8e8", "#555555"], // gray
    ["#bbf0d8", "#0a5c35"], // green
    ["#c7e0ff", "#1a4d8f"], // blue
    ["#ffe4b0", "#7a4800"], // amber
    ["#ffd6d6", "#991b1b"], // red
    ["#e0ccff", "#4c1d95"], // purple
    ["#d1fae5", "#065f46"], // emerald
    ["#fef3c7", "#92400e"], // yellow

    ["#fce7f3", "#9d174d"], // pink
    ["#dbeafe", "#1e3a8a"], // indigo-blue
    ["#ede9fe", "#5b21b6"], // violet
    ["#cffafe", "#155e75"], // cyan
    ["#dcfce7", "#166534"], // lime-green
    ["#ffedd5", "#9a3412"], // orange
    ["#f3e8ff", "#6b21a8"], // lavender
    ["#fae8ff", "#86198f"], // magenta

    ["#f0fdf4", "#14532d"], // mint
    ["#ecfccb", "#3f6212"], // olive
    ["#fef2f2", "#991b1b"], // soft red
    ["#eff6ff", "#1d4ed8"], // soft blue
    ["#ecfeff", "#0f766e"], // teal
    ["#fff7ed", "#c2410c"], // peach
    ["#f5f3ff", "#6d28d9"], // soft purple
    ["#fdf4ff", "#a21caf"], // fuchsia

    ["#e0f2fe", "#075985"], // sky blue
    ["#ccfbf1", "#115e59"], // aqua
    ["#fef9c3", "#854d0e"], // mustard
    ["#fee2e2", "#b91c1c"], // coral red
    ["#e9d5ff", "#7e22ce"], // orchid
    ["#ddd6fe", "#5b21b6"], // periwinkle
    ["#d9f99d", "#365314"], // chartreuse
    ["#fde68a", "#78350f"]  // gold
];

const STATUS_COLORS = {};

RAW_STATUS.forEach((s, i) => {
    STATUS_COLORS[s.id] = {
        bg: palette[i % palette.length][0],
        fg: palette[i % palette.length][1]
    };
});

const allDates = TASKS
    .flatMap(t => [t.start_date, t.due_at])
    .filter(Boolean);

const minDate = new Date(Math.min(...allDates));
minDate.setDate(minDate.getDate() - 1);

const maxDate = new Date(Math.max(...allDates));
maxDate.setDate(maxDate.getDate() + 2);

const TODAY = new Date();

const TOTAL_DAYS =
    Math.round((maxDate - minDate) / 86400000);

const TIMELINE_WIDTH =
    (TOTAL_DAYS + 1) * DAY_WIDTH;

function daysBetween(a, b) {
    return Math.round((b - a) / 86400000);
}

function fmtDate(d) {
    return d
        ? d.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
          })
        : "—";
}

/* -------------------------
   Dynamic Legend
-------------------------- */

const legend = document.getElementById("status-legend");

if (legend) {
    RAW_STATUS.forEach(status => {
        const colors =
            STATUS_COLORS[status.id];

        const item =
            document.createElement("div");

        item.className =
            "legend-item";

        item.innerHTML = `
            <span
                class="legend-dot"
                style="background:${colors.bg}">
            </span>
            <span>${status.status_text}</span>
        `;

        legend.appendChild(item);
    });

    const priorities =
        document.createElement("span");

    priorities.style.marginLeft = "auto";
    priorities.style.color = "#888";

    priorities.innerHTML = `
        Border:
        <b style="color:#94d2a8">Low</b> ·
        <b style="color:#60a5fa">Medium</b> ·
        <b style="color:#f97316">High</b> ·
        <b style="color:#ef4444">Urgent</b>
    `;

    legend.appendChild(priorities);
}

/* -------------------------
   Header
-------------------------- */

const headerTl =
    document.getElementById("header-tl");

headerTl.style.width =
    TIMELINE_WIDTH + "px";

for (let i = 0; i <= TOTAL_DAYS; i++) {
    const d = new Date(minDate);

    d.setDate(d.getDate() + i);

    const cell =
        document.createElement("div");

    cell.className =
        "day-cell" +
        (
            d.getDay() === 0 ||
            d.getDay() === 6
                ? " is-weekend"
                : ""
        ) +
        (
            d.toDateString() ===
            TODAY.toDateString()
                ? " is-today"
                : ""
        );

    if (
        i % 5 === 0 ||
        TOTAL_DAYS <= 20
    ) {
        cell.textContent =
            d.toLocaleDateString(
                "en-IN",
                {
                    day: "numeric",
                    month: "short"
                }
            );
    }

    headerTl.appendChild(cell);
}

/* -------------------------
   Rows
-------------------------- */

const body =
    document.getElementById("gantt-body");

let selectedId = null;

TASKS.forEach(task => {

    const isChild =
        !!task.parent_id;

    const row =
        document.createElement("div");

    row.className = "gantt-row";
    row.id = "row-" + task.id;

    const lbl =
        document.createElement("div");

    lbl.className =
        "task-label" +
        (isChild
            ? " is-child"
            : "");

    lbl.innerHTML = `
        <div class="name"
             title="${task.task_name}">
            ${task.task_name}
        </div>

        <div class="meta">
            ${STATUS[task.status_id] || task.status_id}
            ·
            ${task.estimated_hours}h
        </div>
    `;

    const track =
        document.createElement("div");

    track.className =
        "task-track";

    track.style.width =
        TIMELINE_WIDTH + "px";

    const start =
        task.start_date;

    const end =
        task.due_at ||
        task.start_date;

    const startOffset =
        daysBetween(
            minDate,
            start
        );

    const duration =
        Math.max(
            daysBetween(
                start,
                end
            ) + 1,
            1
        );

    const leftPx =
        startOffset *
        DAY_WIDTH;

    const widthPx =
        duration *
        DAY_WIDTH;

    const bar =
        document.createElement("div");

    bar.className =
        `bar p-${task.priority_level}`;

    const colors =
        STATUS_COLORS[
            task.status_id
        ] || {
            bg: "#ddd",
            fg: "#333"
        };

    bar.style.left =
        leftPx + "px";

    bar.style.width =
        widthPx + "px";

    bar.style.background =
        colors.bg;

    bar.style.color =
        colors.fg;

    bar.title =
        `${task.task_name}\n` +
        `${fmtDate(start)} → ${fmtDate(end)}`;

    const barLabel =
        document.createElement("span");

    barLabel.className =
        "bar-label";

    barLabel.textContent =
        task.task_name;

    bar.appendChild(barLabel);

    requestAnimationFrame(() => {

        const textWidth =
            barLabel.scrollWidth + 20;

        if (
            textWidth >
            widthPx
        ) {
            bar.style.width =
                textWidth + "px";
        }
    });

    track.appendChild(bar);

    row.appendChild(lbl);

    row.appendChild(track);

    body.appendChild(row);

    row.addEventListener(
        "click",
        () =>
            showDetail(
                task,
                row
            )
    );
});

/* -------------------------
   Today Line
-------------------------- */

if (
    TODAY >= minDate &&
    TODAY <= maxDate
) {
    const line =
        document.createElement("div");

    line.className =
        "today-line";

    const todayOffset =
        daysBetween(
            minDate,
            TODAY
        );

    line.style.left =
        (
            260 +
            todayOffset *
                DAY_WIDTH
        ) + "px";

    line.style.height =
        body.scrollHeight +
        "px";

    body.appendChild(line);
}

/* -------------------------
   Detail Panel
-------------------------- */

function showDetail(task, row) {

    if (
        selectedId === task.id
    ) {

        selectedId = null;

        document
            .querySelectorAll(
                ".gantt-row"
            )
            .forEach(r =>
                r.classList.remove(
                    "selected"
                )
            );

        document
            .getElementById(
                "detail-panel"
            )
            .classList.remove(
                "open"
            );

        return;
    }

    selectedId = task.id;

    document
        .querySelectorAll(
            ".gantt-row"
        )
        .forEach(r =>
            r.classList.remove(
                "selected"
            )
        );

    row.classList.add(
        "selected"
    );

    const dep =
        task.depends_on_task_id
            ? TASKS.find(
                  t =>
                      t.id ===
                      task.depends_on_task_id
              )
            : null;

    const children =
        TASKS.filter(
            t =>
                t.parent_id ===
                task.id
        );

    const parent =
        task.parent_id
            ? TASKS.find(
                  t =>
                      t.id ===
                      task.parent_id
              )
            : null;

    const panel =
        document.getElementById(
            "detail-panel"
        );

    panel.innerHTML = `
        <h3>
            ${task.task_name}

            <span
              class="badge b-${task.priority_level}"
              style="margin-left:8px">
              ${task.priority_level}
            </span>

            <span
              class="badge"
              style="margin-left:6px;background:#f0f0f0;color:#555">
              ${STATUS[task.status_id] || task.status_id}
            </span>
        </h3>

        <p style="color:#666;font-size:12px;margin-bottom:12px">
            ${task.description || ""}
        </p>

        <div class="detail-grid">

            <div>
                <div class="k">Start date</div>
                <div class="v">${fmtDate(task.start_date)}</div>
            </div>

            <div>
                <div class="k">Due date</div>
                <div class="v">${fmtDate(task.due_at)}</div>
            </div>

            <div>
                <div class="k">Completed</div>
                <div class="v">${fmtDate(task.completed_at)}</div>
            </div>

            <div>
                <div class="k">Estimated</div>
                <div class="v">${task.estimated_hours}h</div>
            </div>

            <div>
                <div class="k">Parent task</div>
                <div class="v">${parent ? parent.task_name : "—"}</div>
            </div>

            <div>
                <div class="k">Depends on</div>
                <div class="v">${dep ? dep.task_name : "—"}</div>
            </div>

            ${
                children.length
                    ? `
            <div style="grid-column:1/-1">
                <div class="k">
                    Subtasks (${children.length})
                </div>
                <div class="v">
                    ${children
                        .map(c => c.task_name)
                        .join(", ")}
                </div>
            </div>
            `
                    : ""
            }

        </div>
    `;

    panel.classList.add(
        "open"
    );

    panel.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
    });
}