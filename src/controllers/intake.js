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
    });

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
      percent: percent
    });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
};
