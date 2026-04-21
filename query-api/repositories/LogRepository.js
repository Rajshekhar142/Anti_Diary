class LogRepository {
  constructor(dbPool) {
    this.dbPool = dbPool; // Dependency Injection
  }

  async getDailyStats(userId) {
    const query = `
      SELECT COUNT(*) as total_tasks, ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric, 2) as today_hours
      FROM time_logs 
      WHERE user_id = $1 AND (start_time AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date = (CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Kolkata')::date;
    `;
    const { rows } = await this.dbPool.query(query, [userId]);
    return rows[0] || { total_tasks: 0, today_hours: 0 };
  }

  async getOverallStats(userId) {
    const query = `
      SELECT COUNT(*) as total_tasks, ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric, 2) as total_hours_spent
      FROM time_logs WHERE user_id = $1;
    `;
    const { rows } = await this.dbPool.query(query, [userId]);
    return rows[0] || { total_tasks: 0, total_hours_spent: 0 };
  }

  async getCategoryStats(userId) {
    const query = `
      SELECT category, 
        ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric, 2) as hours,
        ROUND((SUM(EXTRACT(EPOCH FROM (end_time - start_time))) / SUM(SUM(EXTRACT(EPOCH FROM (end_time - start_time)))) OVER ()) * 100, 1) as percentage
      FROM time_logs WHERE user_id = $1 GROUP BY category;
    `;
    const { rows } = await this.dbPool.query(query, [userId]);
    return rows;
  }

  async getRecentLogs(userId, limit = 20) {
    const query = `
      SELECT id, task_name, category, start_time, end_time, log_text 
      FROM time_logs WHERE user_id = $1 ORDER BY start_time DESC LIMIT $2;
    `;
    const { rows } = await this.dbPool.query(query, [userId, limit]);
    return rows;
  }

  async getWeeklySnapshots(userId) {
    const query = `
      SELECT time_bucket('1 week', start_time) AS week_start, category,
        ROUND(SUM(EXTRACT(EPOCH FROM (end_time - start_time))/3600)::numeric, 2) as hours
      FROM time_logs WHERE user_id = $1 GROUP BY week_start, category ORDER BY week_start DESC, category ASC;
    `;
    const { rows } = await this.dbPool.query(query, [userId]);
    return rows;
  }
}

module.exports = LogRepository;