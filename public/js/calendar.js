/* calendar.js — client-side interactivity
 *
 * Responsibilities:
 *  1. Task pill / list row click → open task drawer (fetch from API)
 *  2. Drawer close (button + overlay + Escape)
 *  3. Overflow "+N more" badge → scroll to day + expand
 *  4. Keyboard navigation scaffolding (ready for future)
 */

(function () {
  'use strict';

  // ── Element refs ──────────────────────────────────────────
  const drawer        = document.getElementById('task-drawer');
  const overlay       = document.getElementById('drawer-overlay');
  const drawerClose   = document.getElementById('drawer-close');
  const drawerTitle   = document.getElementById('drawer-title');
  const drawerStatus  = document.getElementById('drawer-status');
  const drawerPriority= document.getElementById('drawer-priority');
  const drawerDue     = document.getElementById('drawer-due');
  const drawerStart   = document.getElementById('drawer-start');
  const drawerAssignees = document.getElementById('drawer-assignees');

  // ── Drawer open / close ───────────────────────────────────

  function openDrawer() {
    drawer.classList.add('open');
    drawer.setAttribute('aria-hidden', 'false');
    overlay.classList.add('visible');
    document.body.style.overflow = 'hidden';
  }

  function closeDrawer() {
    drawer.classList.remove('open');
    drawer.setAttribute('aria-hidden', 'true');
    overlay.classList.remove('visible');
    document.body.style.overflow = '';
  }

  drawerClose.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeDrawer();
  });

  // ── Fetch task and populate drawer ────────────────────────

async function showTask(taskId) {

  drawerTitle.textContent = 'Loading…';
  drawerStatus.textContent = '—';
  drawerPriority.textContent = '—';
  drawerDue.textContent = '—';
  drawerStart.textContent = '—';
  drawerAssignees.innerHTML = '';

  openDrawer();

  try {

    const { workspaceId, projectId } = window.CALENDAR_CONTEXT;

const res = await fetch(
 `/api/workspaces/${workspaceId}/projects/${projectId}/calendar/tasks/${taskId}`
);

    if (!res.ok) throw new Error('Not found');

    const task = await res.json();


    drawerTitle.textContent = task.task_name;


    drawerStatus.innerHTML = statusBadge(task.status_text);


    drawerPriority.innerHTML =
      priorityBadge(task.priority_level);


    drawerDue.textContent =
      formatDate(task.due_at);


    drawerStart.textContent =
      formatDate(task.start_date);



    drawerAssignees.innerHTML =
      (task.assignees || [])
      .map(user => {

        const name =
          user.username || user.email_id || "U";

        return `
        <span style="
          display:inline-grid;
          place-items:center;
          width:24px;
          height:24px;
          border-radius:50%;
          background:#E9ECEF;
          font-size:10px;
          font-weight:600;
          color:#495057;
          margin-right:3px;"
          title="${name}">
          ${name.charAt(0).toUpperCase()}
        </span>
        `;

      }).join('');



  } catch(err) {

    console.log(err);
    drawerTitle.textContent =
      'Could not load task';

  }
}

  // ── Delegate clicks on task pills and list rows ───────────

  document.addEventListener('click', e => {
    // Task pill
    const pill = e.target.closest('[data-task-id]');
    if (pill && !e.target.closest('.overflow-badge')) {
      e.preventDefault();
      showTask(pill.dataset.taskId);
      return;
    }

    // Overflow badge — just scroll to day cell (no drawer)
    const badge = e.target.closest('.overflow-badge');
    if (badge) {
      const day = badge.dataset.day;
      const cell = document.getElementById('day-' + day);
      if (cell) {
        cell.scrollIntoView({ behavior: 'smooth', block: 'center' });
        cell.style.outline = '2px solid var(--blue-500)';
        cell.style.outlineOffset = '-2px';
        setTimeout(() => { cell.style.outline = ''; }, 1500);
      }
    }
  });

  // ── Helpers ───────────────────────────────────────────────

  function formatDate(iso) {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      });
    } catch { return '—'; }
  }

  // function statusBadge(status) {
  //   const map = {
  //     'To Do':       ['#ADB5BD', '#F8F9FA'],
  //     'In Progress': ['#4F6EF7', '#EEF2FF'],
  //     'In Review':   ['#F59E0B', '#FFF7ED'],
  //     'Done':        ['#10B981', '#ECFDF5'],
  //   };
  //   const [color, bg] = map[status] ?? ['#ADB5BD', '#F8F9FA'];
  //   return `<span style="
  //     background:${bg};color:${color};
  //     font-size:11px;font-weight:600;padding:3px 9px;
  //     border-radius:20px;">${status}</span>`;
  // }

  function statusBadge(status) {

  return `
  <span style="
    background:#EEF2FF;
    color:#4F46E5;
    font-size:11px;
    font-weight:600;
    padding:3px 9px;
    border-radius:20px;">
    ${status}
  </span>
  `;

}

  function priorityBadge(priority) {
    const map = {
      'Low':    ['#868E96', '#F1F3F5'],
      'Medium': ['#3B82F6', '#EFF6FF'],
      'High':   ['#EA580C', '#FFF7ED'],
      'Urgent': ['#EF4444', '#FEF2F2'],
    };
    const [color, bg] = map[priority] ?? ['#868E96', '#F1F3F5'];
    return `<span style="
      background:${bg};color:${color};
      font-size:11px;font-weight:600;padding:3px 9px;
      border-radius:20px;">${priority}</span>`;
  }

  // function hexToLight(hex) {
  //   // Returns a very light tint of the color for tag backgrounds
  //   return hex + '1A'; // 10% alpha — works as CSS hex+alpha
  // }

  // ── Highlight today's cell on load ────────────────────────
  const todayCell = document.querySelector('.day-cell.today');
  if (todayCell) {
    todayCell.scrollIntoView({ block: 'nearest' });
  }

})();