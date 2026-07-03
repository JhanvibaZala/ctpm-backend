USE project_mgmt_db;

INSERT INTO roles(role_name)
VALUES
('Company Owner'),
('Workspace Admin'),
('Project Manager'),
('Team Member'),
('Guest/Client');

SELECT * FROM roles;
SELECT * FROM permissions;

INSERT INTO permissions(permission_name)
VALUES
('VIEW_SELF_PROFILE'),
('UPDATE_SELF_PROFILE'),
('DELETE_OTHER_ACCOUNT'),
('CREATE_WORKSPACE'),
('DELETE_WORKSPACE'),
('INVITE_USERS_IN_WORKSPACE'),
('KICK_USERS_FROM_WORKSPACE'),
('CREATE_PROJECT'),
('DELETE_PROJECT'),
('EDIT_PROJECT'),
('CREATE_TASK'),
('EDIT_TASK'),
('DELETE_TASK'),
('CHANGE_TASK_STATUS'),
('LOG_PROGRESS'),
('GENERATE_PROJECT_REPORT'),
('DELETE_SELF_PROFILE'),
('INVITE_TEAM_MEMBER_IN_PROJECT'),
('KICK_TEAM_MEMBER_FROM_PROJECT'),
('COMMENT'),
('VIEW_ADMIN_DASHBOARD'),
('VIEW_PROJECT_MANAGER_DASHBOARD'),
('VIEW_TEAM_MEMBER_DASHBOARD'),
('VIEW_CLIENT_DASHBOARD'),
('MARK_TASK_COMPLETE'),
('MARK_TASK_INCOMPLETE'),
('VIEW_ALL_PROJECTS'),
('VIEW_PUBLIC_PROJECTS'),
('VIEW_CURRENT_WORKSPACE'),
('VIEW_ALL_WORKSPACES'),
('VIEW_MY_PROJECT');

-- GUEST PERMISSIONS
INSERT INTO role_permissions(role_id, permission_id)
VALUES
(5, 1),
(5, 2),
(5, 14),
(5, 15),
(5, 20),
(5, 17),
(5, 31);

INSERT INTO permissions(permission_name)
VALUES
('VIEW_ASSIGNED_PROJECTS');

-- TEAM MEMBER PERMISSIONS
INSERT INTO role_permissions(role_id, permission_id)
VALUES
(4, 1),
(4, 2),
(4, 14),
(4, 15),
(4, 20),
(4, 17),
(4, 31),
(4, 11),
(4, 13),
(4, 12),
(4, 16),
(4, 25),
(4, 26),
(4, 29),
(4, 28),
(4, 23),
(4, 32);

-- PROJECT MANAGER PERMISSIONS
INSERT INTO role_permissions(role_id, permission_id)
VALUES
(3, 1),
(3, 2),
(3, 14),
(3, 15),
(3, 20),
(3, 17),
(3, 31),
(3, 11),
(3, 13),
(3, 12),
(3, 16),
(3, 25),
(3, 26),
(3, 29),
(3, 28),
(3, 22),
(3, 8),
(3, 9),
(3, 10),
(3, 18),
(3, 19),
(3, 27),
(3, 32);

-- WORKSPACE ADMIN PERMISSIONS
INSERT INTO role_permissions(role_id, permission_id)
VALUES
(2, 1),
(2, 2),
(2, 3),
(2, 4),
(2, 5),
(2, 6),
(2, 7),
(2, 8),
(2, 9),
(2, 10),
(2, 11),
(2, 12),
(2, 13),
(2, 14),
(2, 15),
(2, 16),
(2, 17),
(2, 18),
(2, 19),
(2, 20),
(2, 21),
(2, 22),
(2, 23),
(2, 24),
(2, 25),
(2, 26),
(2, 27),
(2, 28),
(2, 29),
(2, 30),
(2, 31),
(2, 32);

-- testing
SELECT 
    r.role_name,
    p.id AS permission_id,
    p.permission_name
FROM roles r
INNER JOIN role_permissions rp ON r.id = rp.role_id
INNER JOIN permissions p ON rp.permission_id = p.id
WHERE r.role_name = 'Guest/Client';


-- delete from role_permissions where role_id = 3;