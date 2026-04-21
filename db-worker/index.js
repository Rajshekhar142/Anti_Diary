const { Kafka } = require('kafkajs');
const { Pool } = require('pg');

// 1. PostgreSQL Connection via URI from Docker Compose
const dbUrl = process.env.DATABASE_URL || 'postgresql://admin:password@localhost:5432/monitoring';
const pool = new Pool({
  connectionString: dbUrl,
});

// 2. Kafka Consumer Configuration
const kafkaBroker = process.env.KAFKA_BROKER || 'localhost:9092';
const kafka = new Kafka({
  clientId: 'db-worker',
  brokers: [kafkaBroker]
});

// Changed groupId to force Kafka to recognize this as a new, clean consumer
const consumer = kafka.consumer({ groupId: 'monitoring-pipeline-group' });

const run = async () => {
  try {
    // Connect DB
    await pool.connect();
    console.log(`Connected to TimescaleDB at ${dbUrl}`);
    
    // Connect Kafka
    await consumer.connect();
    console.log(`Kafka Consumer connected to ${kafkaBroker}`);
    
    await consumer.subscribe({ topic: 'time-logs-topic', fromBeginning: true });

    // Process Messages
    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const logData = JSON.parse(message.value.toString());
        console.log(`Processing log for user: ${logData.userId} | Task: ${logData.taskName} | Category: ${logData.category}`);

        const insertQuery = `
          INSERT INTO time_logs (user_id, start_time, end_time, task_name, log_text, category)
          VALUES ($1, $2, $3, $4, $5, $6)
        `;
        const values = [
          logData.userId,
          logData.startTime,
          logData.endTime,
          logData.taskName,
          logData.logText,
          logData.category || 'casual'
        ];

        await pool.query(insertQuery, values);
        console.log('Successfully inserted into TimescaleDB\n');
      },
    });
  } catch (error) {
    console.error('Fatal pipeline error:', error);
  }
};

run();

// 3. Graceful Shutdown
const shutdown = async () => {
  console.log('\nShutting down DB worker gracefully...');
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);