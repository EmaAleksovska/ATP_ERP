# Quick Setup Guide

## Step 1: Database Setup

1. Install PostgreSQL if not already installed
2. Create the database:
```bash
createdb btrip_db
```

Or using psql:
```sql
CREATE DATABASE btrip_db;
```

## Step 2: Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and configure:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

4. Edit `.env` with your database credentials and SMTP settings

5. Run migrations to create tables and seed admin user:
```bash
npm run migrate
```

6. Start the backend server:
```bash
npm run dev
```

Backend should be running on http://localhost:5000

## Step 3: Frontend Setup

1. Open a new terminal and navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env`:
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

4. Start the frontend development server:
```bash
npm run dev
```

Frontend should be running on http://localhost:5173

## Step 4: Login

1. Open http://localhost:5173 in your browser
2. Login with default admin credentials:
   - Email: `admin@btrip.com`
   - Password: `Admin123!`

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `btrip_db` exists

### Port Already in Use
- Change `PORT` in backend `.env` if 5000 is taken
- Change port in `vite.config.js` if 5173 is taken

### Email Not Sending
- Verify SMTP credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check SMTP host and port settings

### Migration Fails
- Ensure PostgreSQL is running
- Check database user has CREATE privileges
- Verify database name matches `.env` configuration

