require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./routes/auth');
const reportsRoutes = require('./routes/reports');
const eventsRoutes = require('./routes/events');
const teamsRoutes = require('./routes/teams');
const resourcesRoutes = require('./routes/resources');
const hospitalsRoutes = require('./routes/hospitals');
const financeRoutes = require('./routes/finance');
const approvalsRoutes = require('./routes/approvals');
const analyticsRoutes = require('./routes/analytics');
const auditRoutes = require('./routes/audit');
const usersRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3001',  // old combined frontend
    'http://localhost:3010',  // admin-frontend
    'http://localhost:3011',  // hospital-frontend
    'http://localhost:3012',  // citizen-frontend
    'http://localhost:3013',  // rescue-frontend
    'http://frontend:3000',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/resources', resourcesRoutes);
app.use('/api/hospitals', hospitalsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/approvals', approvalsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/users', usersRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Not Found',
    details: `Route ${req.method} ${req.path} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Handle validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      error: 'Validation Error',
      details: err.message 
    });
  }
  
  // Handle Prisma errors
  if (err.code === 'P2002') {
    return res.status(409).json({ 
      error: 'Conflict',
      details: 'A record with this value already exists'
    });
  }
  
  if (err.code === 'P2025') {
    return res.status(404).json({ 
      error: 'Not Found',
      details: 'Record not found'
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal Server Error',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 Smart Disaster Response MIS Backend`);
  console.log(`📡 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}\n`);
});

module.exports = app;
