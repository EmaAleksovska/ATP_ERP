# Business Travel Order Management System

A web-based application for creating and managing business travel orders with role-based access control, approval workflows, and automated email notifications.

## Features

- **Authentication System**: Secure login with JWT tokens, password reset functionality
- **User Management**: Admin can create, edit, delete, and manage users
- **Project Management**: Create projects and assign responsible users
- **Travel Request Submission**: Users can submit travel requests for projects
- **Approval Workflow**: Responsible users can approve/reject travel requests
- **PDF Generation**: Automatic generation of travel order PDFs upon approval
- **Email Notifications**: Automated emails for request notifications and approvals
- **Unique Order Numbering**: Auto-incremented travel order numbers (TO-YYYY-NNN format)

## Tech Stack

### Backend
- Node.js with Express
- PostgreSQL database
- JWT authentication
- BCrypt for password hashing
- PDFKit for PDF generation
- Nodemailer for email notifications

### Frontend
- React with Vite
- React Router for navigation
- TanStack Query for data fetching
- Axios for API calls

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory (copy from `.env.example`):
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=btrip_db
DB_USER=postgres
DB_PASSWORD=your_password

JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
SMTP_FROM=noreply@btrip.com

FRONTEND_URL=http://localhost:5173

UPLOAD_DIR=./uploads/travel-orders
```

4. Create the PostgreSQL database:
```bash
createdb btrip_db
```

5. Run database migrations:
```bash
npm run migrate
```

This will create all tables and seed an admin user:
- Email: `admin@btrip.com`
- Password: `Admin123!`

6. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory (copy from `.env.example`):
```env
VITE_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Default Login Credentials

After running migrations, you can login with:
- **Email**: admin@btrip.com
- **Password**: Admin123!

**Important**: Change the default admin password after first login!

## Project Structure

```
BTRIP/
├── backend/
│   ├── config/          # Database configuration
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, rate limiting
│   ├── routes/           # API routes
│   ├── services/         # Business logic (email, PDF, order numbering)
│   ├── uploads/          # Generated PDFs storage
│   └── server.js         # Entry point
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── context/      # React context (Auth)
│   │   ├── pages/        # Page components
│   │   ├── services/     # API service layer
│   │   └── App.jsx       # Main app component
│   └── package.json
├── database/
│   ├── schema.sql        # Database schema
│   ├── seed.sql          # Seed data
│   └── migrate.js        # Migration script
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `PATCH /api/users/:id/status` - Update user status

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project (Admin)
- `GET /api/projects/:id` - Get project
- `PUT /api/projects/:id` - Update project (Admin)
- `DELETE /api/projects/:id` - Delete project (Admin)

### Travel Requests
- `POST /api/travel-requests` - Submit request
- `GET /api/travel-requests` - List requests
- `GET /api/travel-requests/my-requests` - Get user's requests
- `GET /api/travel-requests/my-projects` - Get requests for responsible user's projects
- `GET /api/travel-requests/:id` - Get request
- `PATCH /api/travel-requests/:id/approve` - Approve request
- `PATCH /api/travel-requests/:id/reject` - Reject request

### Travel Orders
- `GET /api/travel-orders/my-orders` - Get user's orders
- `GET /api/travel-orders/:id` - Get order
- `GET /api/travel-orders/:id/download` - Download PDF

## User Roles

### Administrator
- Full access to all features
- User management
- Project management
- View all travel requests

### Standard User
- Submit travel requests
- View own requests and orders
- Download approved travel orders
- Approve/reject requests for assigned projects (if responsible user)

## Email Configuration

The system uses SMTP for sending emails. Configure your SMTP settings in the backend `.env` file.

For Gmail:
1. Enable 2-factor authentication
2. Generate an App Password
3. Use the app password in `SMTP_PASSWORD`

## Security Features

- Password hashing with BCrypt
- JWT token-based authentication
- Rate limiting for login attempts
- Input validation and sanitization
- Role-based access control
- SQL injection protection (parameterized queries)

## License

ISC

