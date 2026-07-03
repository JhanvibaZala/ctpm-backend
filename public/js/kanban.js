/* ================================================================
   kanban.js — Drag-and-drop Kanban engine
   No external dependencies. Pointer Events API for smooth mobile too.
   ================================================================ */

(function () {
  "use strict";

  /* ── State ──────────────────────────────────────────────────── */
  const board = document.getElementById("kanbanBoard");
  const workspaceId = board.dataset.workspace;
  const projectId = board.dataset.project;

  let dragCard = null; // the real card element being dragged
  let ghost = null; // floating clone
  let originColumn = null; // column the drag started from
  let overColumn = null; // column currently hovered
  let indicator = null; // drop-line element
  let offsetX = 0;
  let offsetY = 0;
  let isDragging = false;

  /* ── Helpers ─────────────────────────────────────────────────── */
  function $(sel, ctx = document) {
    return ctx.querySelector(sel);
  }
  function $$(sel, ctx = document) {
    return [...ctx.querySelectorAll(sel)];
  }

  function getColumnBody(colEl) {
    return colEl.querySelector(".kb-column__body");
  }

  function getAccentVar(colEl) {
    return (
      getComputedStyle(colEl).getPropertyValue("--col-accent").trim() ||
      "#1D4ED8"
    );
  }

  /* ── Toast ──────────────────────────────────────────────────── */
  const toastEl = document.getElementById("kbToast");
  let toastTimer = null;

  function showToast(message, type = "success") {
    clearTimeout(toastTimer);
    toastEl.textContent = "";

    // Icon
    const icon = document.createElement("span");
    icon.innerHTML =
      type === "success"
        ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34d399" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
        : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f43f5e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';

    toastEl.appendChild(icon);
    toastEl.appendChild(document.createTextNode(message));
    toastEl.className = `kb-toast kb-toast--show kb-toast--${type}`;

    toastTimer = setTimeout(() => {
      toastEl.classList.remove("kb-toast--show");
    }, 3000);
  }

  /* ── Card count badge ───────────────────────────────────────── */
  function updateCount(colEl) {
    const body = getColumnBody(colEl);
    const cards = body.querySelectorAll(".kb-card");
    const statusId = colEl.dataset.statusId;
    const countEl = document.getElementById(`count-${statusId}`);
    if (countEl) countEl.textContent = cards.length;

    // Toggle empty state
    const emptyEl = body.querySelector(".kb-empty");
    if (emptyEl) {
      if (cards.length > 0) emptyEl.classList.add("kb-empty--hidden");
      else emptyEl.classList.remove("kb-empty--hidden");
    }
  }

  /* ── Ghost (floating clone) ─────────────────────────────────── */
  function createGhost(card, clientX, clientY) {
    const rect = card.getBoundingClientRect();
    offsetX = clientX - rect.left;
    offsetY = clientY - rect.top;

    ghost = card.cloneNode(true);
    ghost.classList.add("kb-drag-ghost");
    ghost.style.width = `${rect.width}px`;
    ghost.style.height = `${rect.height}px`;
    document.body.appendChild(ghost);
    moveGhost(clientX, clientY);
  }

  function moveGhost(clientX, clientY) {
    if (!ghost) return;
    ghost.style.left = `${clientX - offsetX}px`;
    ghost.style.top = `${clientY - offsetY}px`;
  }

  function removeGhost() {
    if (ghost) {
      ghost.remove();
      ghost = null;
    }
  }

  /* ── Drop indicator ─────────────────────────────────────────── */
  function createIndicator(accentColor) {
    indicator = document.createElement("div");
    indicator.className = "kb-drop-indicator";
    indicator.style.setProperty("--col-accent", accentColor);
    return indicator;
  }

  function removeIndicator() {
    if (indicator) {
      indicator.remove();
      indicator = null;
    }
  }

  /**
   * Insert the drop indicator before the card that the cursor is above.
   */
  function positionIndicator(body, clientY) {
    removeIndicator();
    const accent = getAccentVar(body.closest(".kb-column"));
    const ind = createIndicator(accent);
    const cards = [...body.querySelectorAll(".kb-card:not(.kb-dragging)")];

    let inserted = false;
    for (const card of cards) {
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (clientY < midY) {
        body.insertBefore(ind, card);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      // Insert before empty-state placeholder if present, else append
      const emptyEl = body.querySelector(".kb-empty");
      if (emptyEl) body.insertBefore(ind, emptyEl);
      else body.appendChild(ind);
    }
  }

  /* ── Column detection ───────────────────────────────────────── */
  function columnAtPoint(clientX, clientY) {
    const el = document.elementFromPoint(clientX, clientY);
    if (!el) return null;
    return el.closest(".kb-column") || null;
  }

  /* ── Drag start ─────────────────────────────────────────────── */
  function onDragStart(card, clientX, clientY) {
    isDragging = true;
    dragCard = card;
    originColumn = card.closest(".kb-column");

    card.classList.add("kb-dragging");
    createGhost(card, clientX, clientY);
    document.body.style.cursor = "grabbing";
  }

  /* ── Drag move ──────────────────────────────────────────────── */
  function onDragMove(clientX, clientY) {
    if (!isDragging) return;
    moveGhost(clientX, clientY);

    const col = columnAtPoint(clientX, clientY);

    // Left previous column
    if (overColumn && overColumn !== col) {
      overColumn.classList.remove("kb-over");
    }

    if (col) {
      col.classList.add("kb-over");
      overColumn = col;
      positionIndicator(getColumnBody(col), clientY);
    } else {
      removeIndicator();
      overColumn = null;
    }
  }

  /* ── Drag end ───────────────────────────────────────────────── */
  async function onDragEnd(clientX, clientY) {
    console.log("this is in side js file");
    if (!isDragging) return;
    isDragging = false;

    const targetCol = overColumn || columnAtPoint(clientX, clientY);

    // Clean up visual state
    dragCard.classList.remove("kb-dragging");
    document.body.style.cursor = "";
    removeGhost();
    removeIndicator();
    if (overColumn) {
      overColumn.classList.remove("kb-over");
      overColumn = null;
    }

    if (!targetCol || !dragCard) return;

    const newStatusId = Number(targetCol.dataset.statusId);
    const origStatusId = Number(dragCard.dataset.statusId);

    // Same column — nothing to do
    if (newStatusId === origStatusId) return;

    const taskId = dragCard.dataset.taskId;
    const targetBody = getColumnBody(targetCol);
    const originBody = getColumnBody(originColumn);

    /* ── Optimistic DOM update ── */
    // Find where the indicator was and insert the real card there
    const indicatorSibling = targetBody.querySelector(".kb-drop-indicator");
    if (indicatorSibling) {
      targetBody.insertBefore(dragCard, indicatorSibling);
    } else {
      const emptyEl = targetBody.querySelector(".kb-empty");
      if (emptyEl) targetBody.insertBefore(dragCard, emptyEl);
      else targetBody.appendChild(dragCard);
    }

    dragCard.dataset.statusId = newStatusId;

    // Entry animation
    dragCard.style.animation = "none";
    requestAnimationFrame(() => {
      dragCard.style.animation = "";
      dragCard.style.animationName = "cardIn";
      dragCard.style.animationDuration = ".25s";
    });

    updateCount(originColumn);
    updateCount(targetCol);

    dragCard = null;

    /* ── Persist to server ── */
    try {
      const res = await fetch(
        `/api/workspaces/${workspaceId}/projects/${projectId}/kanban/tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ statusId: newStatusId }),
          credentials: "same-origin",
        },
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const data = await res.json().catch(() => ({}));
      const col = targetCol;
      const colTitle =
        col.querySelector(".kb-column__title")?.textContent || "new column";

      if (data.projectStatus === "Completed") {
        showToast(
          `Task moved to "${colTitle}" — 🎉 project marked Completed!`,
          "success",
        );
      } else if (data.projectStatus === "Pending") {
        showToast(`Task moved to "${colTitle}" — project reopened`, "success");
      } else {
        showToast(`Task moved to "${colTitle}"`, "success");
      }
    } catch (err) {
      console.error("[kanban] move failed:", err);
      showToast("Move failed — reverting…", "error");

      /* ── Rollback: put the card back in its origin column ── */
      setTimeout(() => {
        const card = document.querySelector(`[data-task-id="${taskId}"]`);
        if (!card) return;
        card.dataset.statusId = origStatusId;
        const origEmpty = originBody.querySelector(".kb-empty");
        if (origEmpty) originBody.insertBefore(card, origEmpty);
        else originBody.appendChild(card);

        const targetBodyEl = targetCol.querySelector(".kb-column__body");
        updateCount({
          querySelector: (s) =>
            targetBodyEl.closest(".kb-column").querySelector(s),
        });

        // Re-count both columns properly
        const allCols = $$(".kb-column");
        allCols.forEach(updateCount);
      }, 400);
    }
  }

  /* ════════════════════════════════════════════════════════════
     MOUSE drag handlers
  ════════════════════════════════════════════════════════════ */
  function attachMouseDrag(card) {
    card.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return; // left click only
      e.preventDefault();
      onDragStart(card, e.clientX, e.clientY);
    });
  }

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    onDragMove(e.clientX, e.clientY);
  });

  document.addEventListener("mouseup", (e) => {
    if (!isDragging) return;
    onDragEnd(e.clientX, e.clientY);
  });

  /* ════════════════════════════════════════════════════════════
     TOUCH drag handlers (mobile)
  ════════════════════════════════════════════════════════════ */
  function attachTouchDrag(card) {
    let touchTimer = null;
    let activated = false;

    card.addEventListener(
      "touchstart",
      (e) => {
        const touch = e.touches[0];
        touchTimer = setTimeout(() => {
          activated = true;
          onDragStart(card, touch.clientX, touch.clientY);
        }, 180); // long-press threshold
      },
      { passive: true },
    );

    card.addEventListener(
      "touchmove",
      (e) => {
        if (!activated) {
          clearTimeout(touchTimer);
          return;
        }
        e.preventDefault();
        const touch = e.touches[0];
        onDragMove(touch.clientX, touch.clientY);
      },
      { passive: false },
    );

    card.addEventListener("touchend", (e) => {
      clearTimeout(touchTimer);
      if (!activated) return;
      activated = false;
      const touch = e.changedTouches[0];
      onDragEnd(touch.clientX, touch.clientY);
    });

    card.addEventListener("touchcancel", () => {
      clearTimeout(touchTimer);
      activated = false;
      if (isDragging) {
        isDragging = false;
        dragCard?.classList.remove("kb-dragging");
        document.body.style.cursor = "";
        removeGhost();
        removeIndicator();
        if (overColumn) {
          overColumn.classList.remove("kb-over");
          overColumn = null;
        }
      }
    });
  }

  /* ── Attach listeners to existing cards ─────────────────────── */
  function initCard(card) {
    attachMouseDrag(card);
    attachTouchDrag(card);
  }

  $$(".kb-card").forEach(initCard);

  /* ── Observe future cards (if you add tasks dynamically) ────── */
  const observer = new MutationObserver((mutations) => {
    for (const mut of mutations) {
      for (const node of mut.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains("kb-card")) {
          initCard(node);
        }
      }
    }
  });
  $$(".kb-column__body").forEach((body) =>
    observer.observe(body, { childList: true }),
  );

  /* ── Initial empty-state sync ───────────────────────────────── */
  $$(".kb-column").forEach(updateCount);
})();
