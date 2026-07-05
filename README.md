# Taskora Backend

Taskora Backend is a REST API built with Node.js, Express, TypeScript, and MySQL. It provides authentication, workspace management, project management, task management, role-based permissions, and notifications.

---

## Tech Stack

- Node.js
- Express.js
- TypeScript
- MySQL
- JWT
- bcrypt
- express-session
- Cookie Parser
- Passport.js

---

## Features

### Authentication

- Register
- Login
- Forgot Password
- OTP Verification
- Reset Password
- Logout

### Workspace

- Create Workspace
- Update Workspace
- Delete Workspace
- Members
- Invitations

### Project

- CRUD Operations
- Status Tracking
- Project Roles

### Task

- CRUD Operations
- Assignment
- Due Dates
- Priority
- Status
- Labels

### Permissions

- Dynamic Role Based Access Control (RBAC)
- Workspace Roles
- Project Roles
- Custom Permissions

### Security

- JWT Authentication
- Password Hashing
- Secure Cookies
- OTP Verification
- Session Management
- Input Validation

---

## Project Structure

```
src
│
├── config
├── middleware
├── modules
│   ├── auth
│   ├── workspace
│   ├── project
│   └── task
│
├── routes
├── services
├── repositories
├── utils
└── types
```

---

## Installation

```bash
git clone <repository-url>

cd backend

npm install
```

---

## Environment Variables

Create a `.env` file.

```
PORT=3000

DB_HOST=

DB_USER=

DB_PASSWORD=

DB_NAME=

JWT_SECRET=

RESET_SECRET=

SESSION_SECRET=
```

---

## Run

Development

```bash
npm run dev
```

Production

```bash
npm run build

npm start
```

---

## Authentication Flow

```
Register

↓

Login

↓

JWT + Cookies

↓

Protected Routes

↓

Logout
```

Forgot Password

```
Forgot Password

↓

Generate OTP

↓

Store Hashed OTP

↓

Verify OTP

↓

Reset Password
```

---

## API Architecture

```
Routes

↓

Controller

↓

Service

↓

Repository

↓

Database
```

---

## Database

MySQL

Main Tables

- users
- workspaces
- workspace_members
- projects
- project_status
- tasks
- task_comments
- task_labels
- permissions
- roles
- role_permissions
- active_otps

---

## Author

**Jhanviba Zala**