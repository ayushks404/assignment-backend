import IntakeLog from '../models/IntakeLog.js';

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
