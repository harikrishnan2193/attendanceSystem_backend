# Backend Attendance System

A comprehensive Node.js backend system for managing employee attendance, leaves, and breaks with role-based access control.

## 🏗️ Project Structure


backend_attendanceSystem/
├── src/
│ ├── config/
│ │ └── db.js # Database configuration and connection
│ ├── controllers/
│ │ ├── attendanceController.js # Attendance management logic
│ │ ├── breaksController.js # Break management logic
│ │ ├── employeeController.js # Employee management logic
│ │ ├── leaveController.js # Leave management logic
│ │ └── userController.js # User authentication logic
│ ├── middleware/
│ │ ├── authMiddleware.js # JWT token verification
│ │ └── userExistsMiddleware.js # User existence validation
│ ├── models/
│ │ ├── attendanceModel.js # Attendance database model
│ │ ├── breaksModel.js # Breaks database model
│ │ ├── leaveModel.js # Leave database model
│ │ └── userModel.js # User database model
│ ├── routes/
│ │ ├── attendanceRoutes.js # Attendance API endpoints
│ │ ├── breaksRoutes.js # Breaks API endpoints
│ │ ├── employeeRoutes.js # Employee API endpoints
│ │ ├── leaveRoutes.js # Leave API endpoints
│ │ └── userRoutes.js # User API endpoints
│ └── index.js # Application entry point
├── .env # Environment variables
├── .gitignore # Git ignore rules
├── package.json # Project dependencies
└── README.md # Project documentation


## 🚀 Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (ADMIN/EMPLOYEE)
- Password encryption with bcrypt
- Email and password validation

### User Management
- User registration and login
- Employee management (admin only)
- User status management (ACTIVE/INACTIVE/DELETED)

### Attendance System
- Check-in/Check-out functionality
- Attendance status tracking
- Attendance history retrieval
- Real-time attendance monitoring

### Leave Management
- Leave request submission
- Role-based leave approval (auto-approval for admins)
- Leave status updates (admin only)
- Future leave filtering with validity status

### Break Management
- Break start/end tracking
- Break duration calculation
- Integration with attendance records

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MySQL
- **ORM**: Sequelize
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Environment**: dotenv
- **CORS**: cors middleware
- **UUID**: uuid for unique identifiers

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL database
- npm or yarn package manager

## ⚙️ Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd backend_attendanceSystem



Install dependencies

npm install


Environment Setup Create a .env file in the root directory:

PORT=6000
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
JWT_SECRET=your_jwt_secret_key


env
Database Setup

Create a MySQL database

The application will automatically create tables on first run

Start the server

npm start


bash
🔗 API Endpoints
Authentication
POST /api/users/register - User registration

POST /api/users/login - User login

GET /api/users/available/:userId - Get available users (admin only)

Attendance
GET /api/attendance/status/:userId - Get attendance status

POST /api/attendance/checkin - Check-in

POST /api/attendance/checkout - Check-out

GET /api/attendance/history/:userId - Get attendance history

Leaves
POST /api/leaves/submit - Submit leave request

GET /api/leaves - Get leaves (role-based filtering)

PUT /api/leaves/update-status - Update leave status (admin only)

Employees
GET /api/employees/all/:userId - Get all employees (admin only)

DELETE /api/employees/:employeeId - Delete employee (admin only)

POST /api/employees/assign - Assign new employee (admin only)

Breaks
POST /api/breaks/start - Start break

POST /api/breaks/end - End break

🔐 Authentication
All protected routes require a Bearer token in the Authorization header:

Authorization: Bearer <your_jwt_token>


👥 User Roles
EMPLOYEE
Manage own attendance (check-in/out)

Submit leave requests

View own leave history

Manage breaks

ADMIN
All employee permissions

View all employee data

Manage employee accounts

Approve/reject leave requests

Auto-approved leave requests

🗄️ Database Models
Users
user_id, name, email, password, role, status, created_at

Attendance
id, user_id, check_in, check_out, date, total_hours

Leaves
id, user_id, reason, status, start_date, end_date

Breaks
id, attendance_id, break_start, break_end, duration

🔒 Security Features
Password hashing with bcrypt

JWT token expiration (24 hours)

Input validation and sanitization

Role-based route protection

SQL injection prevention with Sequelize ORM

🚦 Server Status
The server runs on http://localhost:6000 by default and provides a health check endpoint at the root path (/).

📝 License
This project is licensed under the ISC License.
```