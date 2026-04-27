import 'dotenv/config';
import { Kafka, Consumer } from 'kafkajs';
import { Pool } from 'pg';
import { CompressionTypes, CompressionCodecs } from 'kafkajs';
import SnappyCodec from 'kafkajs-snappy';

// Register Snappy codec
CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;

// 1. Direct Kafka setup — no abstraction
const kafka = new Kafka({
  clientId: 'db-worker',
  brokers: [process.env.REDPANDA_BROKER!],
  ssl: true,
  sasl: {
    mechanism: 'scram-sha-256',
    username: process.env.REDPANDA_USERNAME!,
    password: process.env.REDPANDA_PASSWORD!,
  },
  // ✅ explicit retry config so you can see exactly whats failing
  retry: {
    initialRetryTime: 300,
    retries: 3,
  },
});

// 2. Direct DB setup
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const consumer: Consumer = kafka.consumer({ groupId: 'monitoring-pipeline-group' });

const run = async () => {
  // Test DB first
  const client = await pool.connect();
  console.log('✅ Connected to TimescaleDB');
  client.release();

  // Then Kafka
  console.log(`Connecting to Redpanda at ${process.env.REDPANDA_BROKER}...`);
  await consumer.connect();
  console.log('✅ Connected to Redpanda');

  await consumer.subscribe({ topic: 'time-logs-topic', fromBeginning: true });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;

      const logData = JSON.parse(message.value.toString());
      console.log(`Processing: user=${logData.userId} task=${logData.taskName}`);

      await pool.query(
        `INSERT INTO time_logs (user_id, start_time, end_time, task_name, log_text, category)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          logData.userId,
          logData.startTime,
          logData.endTime,
          logData.taskName,
          logData.logText,
          logData.category || 'casual',
        ]
      );
      console.log('✅ Inserted into TimescaleDB');
    },
  });
};

run().catch((err) => {
  console.error('❌ Fatal error:', err.message); // ← cleaner error
  process.exit(1);
});

const shutdown = async () => {
  await consumer.disconnect();
  await pool.end();
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);