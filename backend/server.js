import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Import routes
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import projectRoutes from './routes/projectRoutes.js';
import travelRequestRoutes from './routes/travelRequestRoutes.js';
import travelOrderRoutes from './routes/travelOrderRoutes.js';
import inputCorrespondenceRoutes from './routes/inputCorrespondenceRoutes.js';
import outputCorrespondenceRoutes from './routes/outputCorrespondenceRoutes.js';
import { ensureCorrespondenceTables } from './utils/ensureCorrespondenceTables.js';
import { ensureProjectsSchema } from './utils/ensureProjectsSchema.js';

// Import error handler
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());

// CORS configuration - allow multiple origins
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://200.200.200.231:5173',
  'http://46.10.201.238:5173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_EXTERNAL
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow all origins that match our allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Allow all in development
    return callback(null, true);
  },
  credentials: true
}));
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/travel-requests', travelRequestRoutes);
app.use('/api/travel-orders', travelOrderRoutes);
app.use('/api/input-correspondence', inputCorrespondenceRoutes);
app.use('/api/output-correspondence', outputCorrespondenceRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const HOST = process.env.HOST || '0.0.0.0';

Promise.all([ensureCorrespondenceTables(), ensureProjectsSchema()])
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`Server is running on http://${HOST}:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize database schema:', error);
    process.exit(1);
  });

