class LogController {
  constructor(logRepository) {
    this.repo = logRepository; // Dependency Injection
  }

  async getDailyStats(req, res) {
    try {
      const stats = await this.repo.getDailyStats(req.params.userId);
      res.status(200).json(stats);
    } catch (error) {
      console.error(error); res.status(500).json({ error: 'Server Error' });
    }
  }

  async getOverallStats(req, res) {
    try {
      const stats = await this.repo.getOverallStats(req.params.userId);
      res.status(200).json(stats);
    } catch (error) {
      console.error(error); res.status(500).json({ error: 'Server Error' });
    }
  }

  async getCategoryStats(req, res) {
    try {
      const stats = await this.repo.getCategoryStats(req.params.userId);
      res.status(200).json(stats);
    } catch (error) {
      console.error(error); res.status(500).json({ error: 'Server Error' });
    }
  }

  async getRecentLogs(req, res) {
    try {
      const logs = await this.repo.getRecentLogs(req.params.userId, req.query.limit);
      res.status(200).json(logs);
    } catch (error) {
      console.error(error); res.status(500).json({ error: 'Server Error' });
    }
  }

  async getWeeklySnapshots(req, res) {
    try {
      const snapshots = await this.repo.getWeeklySnapshots(req.params.userId);
      res.status(200).json(snapshots);
    } catch (error) {
      console.error(error); res.status(500).json({ error: 'Server Error' });
    }
  }
}

module.exports = LogController;