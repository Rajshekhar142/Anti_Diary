const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

// Import our new classes
const LogRepository = require('./repositories/LogRepository.js');
const LogController = require('./controllers/LogController.js');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Database Pool
const dbUrl = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/monitoring';
const pool = new Pool({ connectionString: dbUrl });

// 2. Dependency Injection: Pass Pool to Repo, Repo to Controller
const logRepo = new LogRepository(pool);
const logController = new LogController(logRepo);

// 3. Define Routes (Clean and Readable!)
app.get('/api/stats/daily/:userId', (req, res) => logController.getDailyStats(req, res));
app.get('/api/stats/:userId', (req, res) => logController.getOverallStats(req, res));
app.get('/api/stats/categories/:userId', (req, res) => logController.getCategoryStats(req, res));
app.get('/api/logs/:userId', (req, res) => logController.getRecentLogs(req, res));
app.get('/api/snapshots/weekly/:userId', (req, res) => logController.getWeeklySnapshots(req, res));

// 4. Start Server
const PORT = 3002;
const server = app.listen(PORT, () => {
  console.log(`Query API running on port ${PORT}`);
  pool.connect()
    .then(() => console.log(`Connected to TimescaleDB for Read Operations`))
    .catch(err => console.error('DB Connection Error:', err));
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down Query API...');
  await pool.end();
  server.close(() => process.exit(0));
});
process.on('SIGTERM', async () => {
  await pool.end();
  server.close(() => process.exit(0));
});