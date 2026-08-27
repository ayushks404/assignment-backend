import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import intakeRouter from './routes/intake.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/intake', intakeRouter);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Water Intake Tracker API' });
});

export default app;

