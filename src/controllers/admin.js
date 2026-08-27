import User from '../models/User.js';
import IntakeLog from '../models/IntakeLog.js';

export const listUsers = async (req, res) => {
  try {
    const users = await User.find({});
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const getUserHistory = async (req, res) => {
  const { id } = req.params;

  let fromDate = req.query.from ? new Date(req.query.from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let toDate = req.query.to ? new Date(req.query.to) : new Date();

  fromDate.setUTCHours(0, 0, 0, 0);
  toDate.setUTCHours(23, 59, 59, 999);

  try {
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const goalMl = user.dailyGoalMl;

    const logs = await IntakeLog.find({
      user: id,
      loggedAt: { $gte: fromDate, $lte: toDate }
    }).sort({ loggedAt: -1 });

    const groups = {};
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const dateStr = log.loggedAt.toISOString().split('T')[0];
      if (!groups[dateStr]) {
        groups[dateStr] = 0;
      }
      groups[dateStr] += log.amountMl;
    }

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
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID' });
    }
    return res.status(500).json({ message: 'Internal server error' });
  }
};
