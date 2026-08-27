import IntakeLog from '../models/IntakeLog.js';
import User from '../models/User.js';

export const logIntake = async (req, res) => {
  const { amountMl } = req.body || {};

  // Validation: must be a number, > 0
  if (typeof amountMl !== 'number' || amountMl <= 0) {
    return res.status(400).json({ message: 'amountMl must be a positive number' });
  }

  try {
    const log = new IntakeLog({
      user: req.user.id,
      amountMl: amountMl
    });

    await log.save();

    return res.status(201).json(log);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getTodayIntake = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setUTCHours(23, 59, 59, 999);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const goalMl = user.dailyGoalMl;

    const logs = await IntakeLog.find({
      user: req.user.id,
      loggedAt: { $gte: startOfToday, $lte: endOfToday }
    }).sort({ loggedAt: -1 });

    let totalMl = 0;
    for (let i = 0; i < logs.length; i++) {
      totalMl += logs[i].amountMl;
    }

    const remainingMl = Math.max(0, goalMl - totalMl);
    const percent = goalMl > 0 ? Math.round((totalMl / goalMl) * 100) : 0;

    return res.status(200).json({
      totalMl: totalMl,
      goalMl: goalMl,
      remainingMl: remainingMl,
      percent: percent,
      logs: logs
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getIntakeHistory = async (req, res) => {
  let fromDate = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let toDate = req.query.to ? new Date(req.query.to) : new Date();

  fromDate.setUTCHours(0, 0, 0, 0);
  toDate.setUTCHours(23, 59, 59, 999);

  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const goalMl = user.dailyGoalMl;

    // Fetch logs within date range
    const logs = await IntakeLog.find({
      user: req.user.id,
      loggedAt: { $gte: fromDate, $lte: toDate }
    }).sort({ loggedAt: -1 });

    // Group by date string (YYYY-MM-DD)
    const groups = {};
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const dateStr = log.loggedAt.toISOString().split('T')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = 0;
      }
      groups[dateStr] += log.amountMl;
    }

    // Map groups to required array shape
    const history = [];
    const dates = Object.keys(groups).sort().reverse();
    for (let i = 0; i < dates.length; i++) {
      const date = dates[i];
      history.push({
        date: date,
        totalMl: groups[date],
        goalMl: goalMl
      });
    }

    return res.status(200).json(history);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteIntake = async (req, res) => {
  const { id } = req.params;

  try {
    const log = await IntakeLog.findById(id);
    if (!log) {
      return res.status(404).json({ message: 'Intake log not found' });
    }

    // Ownership check
    if (log.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "You cannot delete another user's entry" });
    }

    await IntakeLog.findByIdAndDelete(id);

    return res.status(200).json({ message: 'Intake log deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid intake log ID' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};
