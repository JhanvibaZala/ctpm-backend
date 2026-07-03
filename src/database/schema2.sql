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

    CREATE TABLE IF NOT EXISTS users(
        id CHAR(36) PRIMARY KEY,
        username VARCHAR(30) UNIQUE NOT NULL,
        first_name VARCHAR(25) NOT NULL,
        last_name VARCHAR(25),
        email_id VARCHAR(255) UNIQUE NOT NULL, 
        hashed_password CHAR(60),
        profile_pic_path VARCHAR(255),
        bio VARCHAR(1023),
        sso_provider VARCHAR(50), -- 'google', 'microsoft', 'email'
        sso_provider_id VARCHAR(255), -- ID from Google/Microsoft
        account_status ENUM('Pending Approval', 'Active', 'Deleted') NOT NULL DEFAULT 'Active',
        joined_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        
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

    CREATE TABLE IF NOT EXISTS role_permissions(
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
        subscription_end DATETIME DEFAULT (UTC_TIMESTAMP())
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
    -- 3. NEW: PROJECT LAYER (Extended)
    -- ==========================================

    -- A workspace can contain multiple projects (1-to-Many Relationship)
    -- ==========================================
    -- 3. PROJECT LAYER (With Project-Specific Roles)
    -- ==========================================

    -- A workspace can contain multiple projects (1-to-Many Relationship)
    CREATE TABLE IF NOT EXISTS projects (
        id CHAR(36) PRIMARY KEY,
        workspace_id CHAR(36) NOT NULL, 
        project_name VARCHAR(50) NOT NULL,
        description VARCHAR(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        status ENUM('Planning', 'Active', 'On Hold', 'Completed') NOT NULL DEFAULT 'Planning',
        priority_level ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
        visibility ENUM('Public', 'Private') NOT NULL DEFAULT 'Private',
        created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        deadline_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        completed_at DATETIME NULL,
        
        CONSTRAINT fk_projects_workspace FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    );

    -- Projects can have multiple team members, each with a specific project role
    CREATE TABLE IF NOT EXISTS project_members (
        project_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        role_id INT NOT NULL, -- New: Dictates the user's role specifically within this project
        
        PRIMARY KEY (project_id, user_id), 
        CONSTRAINT fk_pm_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_user    FOREIGN KEY (user_id)    REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_pm_role    FOREIGN KEY (role_id)    REFERENCES roles(id) ON DELETE RESTRICT
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
        parent_id CHAR(36) NULL, -- Made explicitly clear that top-level tasks have no parent
        depends_on_task_id CHAR(36) NULL,
        project_id CHAR(36) NOT NULL,
        -- assigned_to INT NULL, -- FIX 1: Allows tasks to be assigned to a specific user
        task_name VARCHAR(50) NOT NULL,
        description VARCHAR(1023) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
        status ENUM('Planning', 'Active', 'On Hold', 'Completed') NOT NULL DEFAULT 'Planning',
        priority_level ENUM('Low', 'Medium', 'High', 'Urgent') NOT NULL DEFAULT 'Medium',
        created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        due_at DATETIME NULL, -- Cleaner alternative to an automatic deadline timestamp
        completed_at DATETIME NULL,
        is_deleted BIT NOT NULL DEFAULT 0,
        
        CONSTRAINT fk_pt_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
        CONSTRAINT fk_pt_pt      FOREIGN KEY (parent_id)  REFERENCES project_tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_pt_pt_2      FOREIGN KEY (depends_on_task_id)  REFERENCES project_tasks(id) ON DELETE CASCADE
        -- CONSTRAINT fk_pt_user    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL 
        -- (Using SET NULL here ensures that if a employee leaves the company, the task isn't wiped out; it just becomes unassigned)
    );

    CREATE TABLE IF NOT EXISTS task_members (
        task_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL,
        
        PRIMARY KEY(task_id, user_id),
        
        CONSTRAINT fk_tm_pt FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_tm_users FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS task_comments (
        id CHAR(36) PRIMARY KEY,
        task_id CHAR(36) NOT NULL,
        user_id CHAR(36) NOT NULL, -- FIX 2: Links the comment to the author
        comment_text VARCHAR(1000) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL, -- Comments shouldn't be empty strings
        created_at DATETIME DEFAULT (UTC_TIMESTAMP()), -- Added tracking for comment time
        
        CONSTRAINT fk_tc_pt   FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_tc_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 1. Define the Custom Field Definition (Created by the Project Manager)
    CREATE TABLE IF NOT EXISTS custom_field_definitions (
        id CHAR(36) PRIMARY KEY,
        project_id CHAR(36) NOT NULL, -- The custom field only exists inside this project
        field_name VARCHAR(50) NOT NULL, -- e.g., "Story Points", "Estimated Budget"
        field_type ENUM('Text', 'Number', 'Dropdown', 'Currency') NOT NULL,
        
        CONSTRAINT fk_cfd_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
    );

    -- 2. If the field_type is 'Dropdown', store the valid choices here
    CREATE TABLE IF NOT EXISTS custom_field_dropdown_options (
        id CHAR(36) PRIMARY KEY,
        field_definition_id CHAR(36) NOT NULL,
        option_value VARCHAR(100) NOT NULL, -- e.g., "High", "Medium", "Low" or "Facebook", "Instagram"
        
        CONSTRAINT fk_cfdo_definition FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
    );

    -- 3. Store the actual values entered by users for a specific task
    CREATE TABLE IF NOT EXISTS task_custom_field_values (
        task_id CHAR(36) NOT NULL,
        field_definition_id CHAR(36) NOT NULL,
        field_value TEXT NOT NULL, -- Stores the user input as a string (your backend casts it based on field_type)
        
        PRIMARY KEY (task_id, field_definition_id),
        CONSTRAINT fk_cfv_task FOREIGN KEY (task_id) REFERENCES project_tasks(id) ON DELETE CASCADE,
        CONSTRAINT fk_cfv_definition FOREIGN KEY (field_definition_id) REFERENCES custom_field_definitions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS active_otps (
        id CHAR(36) PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        hashed_otp char(60) NOT NULL,
        session_id varchar(85) NOT NULL,
        created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        expires_at DATETIME DEFAULT (DATE_ADD(UTC_TIMESTAMP(), INTERVAL 5 MINUTE)),
        
        CONSTRAINT fk_ao_user FOREIGN KEY (user_email) REFERENCES users(email_id)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id CHAR(36) PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        hashed_token char(60) NOT NULL,
        created_at DATETIME DEFAULT (UTC_TIMESTAMP()),
        expires_at DATETIME NOT NULL,
        
        CONSTRAINT fk_rf_user FOREIGN KEY (user_id) REFERENCES users(id)
    );

