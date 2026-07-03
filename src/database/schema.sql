-- DROP DATABASE project_mgmt_db;
CREATE DATABASE IF NOT EXISTS project_mgmt_db;
USE project_mgmt_db;

-- ==========================================
-- 1. AUTH & SYSTEM CONFIG TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS roles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    username VARCHAR(30) UNIQUE NOT NULL,
    first_name VARCHAR(25) NOT NULL,
    last_name VARCHAR(25),
    email_id VARCHAR(255) UNIQUE NOT NULL,
    hashed_password CHAR(60),
    profile_pic_path VARCHAR(255),
    bio VARCHAR(500),
    sso_provider VARCHAR(50),       -- 'google', 'microsoft', 'email'
    sso_provider_id VARCHAR(255),   -- ID from Google/Microsoft
    account_status ENUM('Pending Approval', 'Active', 'Deleted') NOT NULL DEFAULT 'Active',
    joined_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    updated_at DATETIME DEFAULT (UTC_TIMESTAMP()) ON UPDATE UTC_TIMESTAMP(),

    CONSTRAINT chk_auth_method CHECK (
        (hashed_password IS NOT NULL AND sso_provider IS NULL AND sso_provider_id IS NULL)
        OR
        (hashed_password IS NULL AND sso_provider IS NOT NULL AND sso_provider_id IS NOT NULL)
    )
);

CREATE TABLE IF NOT EXISTS permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    permission_name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id INT NOT NULL,
    permission_id INT NOT NULL,
    PRIMARY KEY (role_id, permission_id),
    CONSTRAINT fk_role_map FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_perm_map FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- ==========================================
-- 2. WORKSPACE LAYER
-- ==========================================

CREATE TABLE IF NOT EXISTS workspaces (
    id CHAR(36) PRIMARY KEY,
    workspace_name VARCHAR(25) NOT NULL,
    description VARCHAR(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    subscription_start DATETIME DEFAULT (UTC_TIMESTAMP()),
    subscription_end DATETIME DEFAULT (UTC_TIMESTAMP()),
    updated_at DATETIME DEFAULT (UTC_TIMESTAMP()) ON UPDATE UTC_TIMESTAMP()
);

CREATE TABLE IF NOT EXISTS workspace_members (
    workspace_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role_id INT NOT NULL,

    PRIMARY KEY (workspace_id, user_id),
    CONSTRAINT fk_ws_members_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
    CONSTRAINT fk_ws_members_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_ws_members_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- ==========================================
-- 3. PROJECT LAYER
-- ==========================================

CREATE TABLE IF NOT EXISTS projects (
    id CHAR(36) PRIMARY KEY,
    workspace_id CHAR(36) NOT NULL,
    project_name VARCHAR(50) NOT NULL,
    description VARCHAR(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    priority_level ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    status ENUM('Pending', 'WIP', 'On Hold', 'Completed') NOT NULL DEFAULT 'Pending',
    visibility ENUM('Public', 'Private') NOT NULL DEFAULT 'Private',
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    deadline_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    completed_at DATETIME NULL,
    updated_at DATETIME DEFAULT (UTC_TIMESTAMP()) ON UPDATE UTC_TIMESTAMP(),

    CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
);

-- ==========================================
-- CHANGE 1: Replaced global `statuses` + `project_allowed_statuses` tables
--           with a single per-project `project_statuses` table.
--
-- Benefits:
--   - Statuses are scoped to their project; no cross-project bleed
--   - status_level ordering is enforced per project (no duplicates within one project)
--   - status_text uniqueness is enforced per project
--   - Eliminates the need for a join-table allowlist entirely
-- ==========================================

CREATE TABLE IF NOT EXISTS project_statuses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id CHAR(36) NOT NULL,
    status_text VARCHAR(20) NOT NULL,
    status_level INT NOT NULL,  -- Defines display/ordering within this project (e.g. 1=To Do, 2=In Progress, 3=Done)

    -- CHANGE 2: No two statuses in the same project can share the same order position
    UNIQUE (project_id, status_level),
    -- CHANGE 3: No two statuses in the same project can share the same name
    UNIQUE (project_id, status_text),

    CONSTRAINT fk_ps_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS project_members (
    project_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    role_id INT NOT NULL,

    PRIMARY KEY (project_id, user_id),
    CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_pm_role FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS project_files (
    id CHAR(36) PRIMARY KEY,
    file_path VARCHAR(255) NOT NULL,
    project_id CHAR(36) NOT NULL,

    CONSTRAINT fk_pf_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- ==========================================
-- 4. TASKS, ASSIGNMENTS & COMMUNICATION LAYER
-- ==========================================

CREATE TABLE IF NOT EXISTS project_tasks (
    id CHAR(36) PRIMARY KEY,
    parent_id CHAR(36) NULL,
    depends_on_task_id CHAR(36) NULL,
    project_id CHAR(36) NOT NULL,
    task_name VARCHAR(50) NOT NULL,
    description VARCHAR(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
    updated_at DATETIME DEFAULT (UTC_TIMESTAMP()) ON UPDATE UTC_TIMESTAMP(),

    -- CHANGE 4: Removed DEFAULT 1 (was unsafe — assumed a row with id=1 always exists).
    --           status_id now references project_statuses instead of the old global statuses table.
    --           Application layer must always supply an explicit status on task creation.
    status_id INT NOT NULL,

    priority_level ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    due_at DATETIME NULL,
    completed_at DATETIME NULL,
    is_deleted BIT NOT NULL DEFAULT 0,

    CONSTRAINT fk_pt_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_parent FOREIGN KEY (parent_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_pt_depends FOREIGN KEY (depends_on_task_id) REFERENCES project_tasks(id) ON DELETE SET NULL,

    -- CHANGE 5: FK now points to project_statuses instead of old global statuses table
    CONSTRAINT fk_pt_status FOREIGN KEY (status_id) REFERENCES project_statuses(id) ON DELETE RESTRICT
    -- Note: The trigger below enforces that status_id belongs to this task's project.
    --       This FK alone only checks the status row exists — not that it's for the right project.
);

-- ==========================================
-- CHANGE 6: Triggers to enforce that a task's status belongs to its own project.
--           Both INSERT and UPDATE are covered.
--
-- Why a trigger and not just the FK?
--   project_statuses rows are per-project, but the FK only checks the row exists.
--   Without this trigger, you could assign a status from Project B to a task in Project A
--   as long as the status id is valid in project_statuses.
-- ==========================================

DELIMITER $$

CREATE TRIGGER trg_validate_task_status_insert
BEFORE INSERT ON project_tasks
FOR EACH ROW
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM project_statuses
        WHERE id = NEW.status_id AND project_id = NEW.project_id
    ) THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'status_id does not belong to this task''s project';
    END IF;
END$$

CREATE TRIGGER trg_validate_task_status_update
BEFORE UPDATE ON project_tasks
FOR EACH ROW
BEGIN
    IF NEW.status_id != OLD.status_id OR NEW.project_id != OLD.project_id THEN
        IF NOT EXISTS (
            SELECT 1 FROM project_statuses
            WHERE id = NEW.status_id AND project_id = NEW.project_id
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'status_id does not belong to this task''s project';
        END IF;
    END IF;
END$$

DELIMITER ;

CREATE TABLE IF NOT EXISTS task_members (
    task_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,

    PRIMARY KEY (task_id, user_id),
    CONSTRAINT fk_tm_pt FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_comments (
    id CHAR(36) PRIMARY KEY,
    task_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    comment_text VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),

    CONSTRAINT fk_tc_pt FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- 5. CUSTOM FIELDS
-- ==========================================

CREATE TABLE IF NOT EXISTS custom_field_definitions (
    id CHAR(36) PRIMARY KEY,
    project_id CHAR(36) NOT NULL,
    field_name VARCHAR(50) NOT NULL,
    field_type ENUM('Text', 'Number', 'Dropdown', 'Currency') NOT NULL,

    CONSTRAINT fk_cfd_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_field_dropdown_options (
    id CHAR(36) PRIMARY KEY,
    field_definition_id CHAR(36) NOT NULL,
    option_value VARCHAR(100) NOT NULL,

    CONSTRAINT fk_cfdo_definition FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS task_custom_field_values (
    task_id CHAR(36) NOT NULL,
    field_definition_id CHAR(36) NOT NULL,
    field_value TEXT NOT NULL,

    PRIMARY KEY (task_id, field_definition_id),
    CONSTRAINT fk_cfv_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
    CONSTRAINT fk_cfv_definition FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. AUTH TOKENS
-- ==========================================

CREATE TABLE IF NOT EXISTS active_otps (
    id CHAR(36) PRIMARY KEY,
    user_email VARCHAR(255) NOT NULL,
    hashed_otp CHAR(60) NOT NULL,
    session_id VARCHAR(85) NOT NULL,
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    expires_at DATETIME DEFAULT (DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)),

    CONSTRAINT fk_ao_user FOREIGN KEY (user_email) REFERENCES users(email_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    hashed_token CHAR(60) NOT NULL,
    created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
    expires_at DATETIME NOT NULL,

    CONSTRAINT fk_rf_user FOREIGN KEY (user_id) REFERENCES users(id)
);

-- indexes

CREATE INDEX idx_otps_email_session ON active_otps (user_email, session_id);

-- Foreign keys MySQL does NOT auto-index (unlike PostgreSQL):
CREATE INDEX idx_project_tasks_project   ON project_tasks (project_id);
CREATE INDEX idx_project_tasks_parent    ON project_tasks (parent_id);
CREATE INDEX idx_project_tasks_status    ON project_tasks (status_id);
CREATE INDEX idx_project_statuses_proj   ON project_statuses (project_id);
CREATE INDEX idx_task_comments_task      ON task_comments (task_id);
CREATE INDEX idx_task_members_user       ON task_members (user_id);
CREATE INDEX idx_project_members_user    ON project_members (user_id);
CREATE INDEX idx_refresh_tokens_user     ON refresh_tokens (user_id);
CREATE INDEX idx_refresh_tokens_expires  ON refresh_tokens (expires_at); -- for cleanup jobs

DELIMITER $$

-- ==========================================
-- TRIGGER 1: Validate depends_on_task_id on INSERT
-- Ensures task dependencies stay within the same project
-- ==========================================

CREATE TRIGGER trg_validate_task_dependency_insert
BEFORE INSERT ON project_tasks
FOR EACH ROW
BEGIN
    IF NEW.depends_on_task_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM project_tasks
            WHERE id = NEW.depends_on_task_id AND project_id = NEW.project_id
        ) THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'Task dependency must be within the same project';
        END IF;
    END IF;
END$$

-- ==========================================
-- TRIGGER 2: Validate depends_on_task_id on UPDATE
-- ==========================================

CREATE TRIGGER trg_validate_task_dependency_update
BEFORE UPDATE ON project_tasks
FOR EACH ROW
BEGIN
    IF NEW.depends_on_task_id IS NOT NULL THEN
        IF NEW.depends_on_task_id != OLD.depends_on_task_id OR NEW.project_id != OLD.project_id THEN
            IF NOT EXISTS (
                SELECT 1 FROM project_tasks
                WHERE id = NEW.depends_on_task_id AND project_id = NEW.project_id
            ) THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Task dependency must be within the same project';
            END IF;
        END IF;
    END IF;
END$$

-- ==========================================
-- TRIGGER 3: Validate parent_id on INSERT
-- Rules enforced:
--   1. parent_id must belong to the same project
--   2. Max depth of 3 levels (root -> child -> grandchild, grandchild cannot be a parent)
--   3. No cycles (walks up the tree to ensure NEW.id never appears as an ancestor)
--      Note: cycle check on INSERT is mainly a safety net —
--      a brand new row can't truly form a cycle unless a stale UUID is reused.
--      The UPDATE trigger is where cycle detection really matters.
-- ==========================================

CREATE TRIGGER trg_validate_task_parent_insert
BEFORE INSERT ON project_tasks
FOR EACH ROW
BEGIN
    DECLARE v_project_id CHAR(36);
    DECLARE v_depth INT DEFAULT 0;
    DECLARE v_current_id CHAR(36);
    DECLARE v_parent_id CHAR(36);

    IF NEW.parent_id IS NOT NULL THEN

        -- Rule 1: parent must belong to the same project
        SELECT project_id INTO v_project_id
        FROM project_tasks
        WHERE id = NEW.parent_id;

        IF v_project_id IS NULL OR v_project_id != NEW.project_id THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'parent_id must belong to the same project';
        END IF;

        -- Rule 2 + 3: Walk up the ancestor chain.
        -- Count how many ancestors the parent already has (= parent's depth).
        -- If parent is already at depth 2 (grandchild level), NEW task would be depth 3,
        -- which exceeds the 3-level limit.
        -- Simultaneously check that NEW.id doesn't appear in the ancestor chain (cycle guard).
        SET v_current_id = NEW.parent_id;
        SET v_depth = 1; -- NEW task is at least depth 1 (it has a parent)

        WHILE v_current_id IS NOT NULL DO
            -- Cycle guard: if we see NEW.id while walking ancestors, it's a cycle
            IF v_current_id = NEW.id THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Cycle detected in task hierarchy';
            END IF;

            SELECT parent_id INTO v_parent_id
            FROM project_tasks
            WHERE id = v_current_id;

            IF v_parent_id IS NOT NULL THEN
                SET v_depth = v_depth + 1;
            END IF;

            -- Depth limit: root(1) -> child(2) -> grandchild(3), no further
            IF v_depth >= 3 THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Task hierarchy cannot exceed 3 levels deep';
            END IF;

            SET v_current_id = v_parent_id;
        END WHILE;

    END IF;
END$$

-- ==========================================
-- TRIGGER 4: Validate parent_id on UPDATE
-- Same rules as INSERT, but cycle detection is critical here:
-- e.g. Task A (parent=B) updated so that B's parent becomes A → cycle
-- ==========================================

CREATE TRIGGER trg_validate_task_parent_update
BEFORE UPDATE ON project_tasks
FOR EACH ROW
BEGIN
    DECLARE v_project_id CHAR(36);
    DECLARE v_depth INT DEFAULT 0;
    DECLARE v_current_id CHAR(36);
    DECLARE v_parent_id CHAR(36);

    -- Only run if parent_id or project_id actually changed
    IF NEW.parent_id IS NOT NULL AND (
        NEW.parent_id != OLD.parent_id OR OLD.parent_id IS NULL OR NEW.project_id != OLD.project_id
    ) THEN

        -- Rule 1: parent must belong to the same project
        SELECT project_id INTO v_project_id
        FROM project_tasks
        WHERE id = NEW.parent_id;

        IF v_project_id IS NULL OR v_project_id != NEW.project_id THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'parent_id must belong to the same project';
        END IF;

        -- A task cannot be its own parent
        IF NEW.parent_id = NEW.id THEN
            SIGNAL SQLSTATE '45000'
                SET MESSAGE_TEXT = 'A task cannot be its own parent';
        END IF;

        -- Rule 2 + 3: Walk up the ancestor chain from NEW.parent_id
        SET v_current_id = NEW.parent_id;
        SET v_depth = 1;

        WHILE v_current_id IS NOT NULL DO
            -- Cycle guard: if we encounter the task being updated, it's a cycle
            -- e.g. we're updating Task A's parent to Task C,
            -- but Task C's ancestor chain contains Task A
            IF v_current_id = NEW.id THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Cycle detected in task hierarchy';
            END IF;

            SELECT parent_id INTO v_parent_id
            FROM project_tasks
            WHERE id = v_current_id;

            IF v_parent_id IS NOT NULL THEN
                SET v_depth = v_depth + 1;
            END IF;

            IF v_depth >= 3 THEN
                SIGNAL SQLSTATE '45000'
                    SET MESSAGE_TEXT = 'Task hierarchy cannot exceed 3 levels deep';
            END IF;

            SET v_current_id = v_parent_id;
        END WHILE;

    END IF;
END$$

DELIMITER ;
