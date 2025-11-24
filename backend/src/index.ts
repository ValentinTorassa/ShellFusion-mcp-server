import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRouter from './routes/authRouter';
import ticketsRouter from './routes/tickets';
import { apiKeyAuth } from './middlewares/apiKeyAuth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/users_login';

// Conectar a MongoDB
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB successfully');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
}));

app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint (no API key)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Rutas de autenticación (públicas, no requieren API key)
app.use('/api/auth', authRouter);

// Aplicar API key auth solo a las rutas que lo requieren
app.use('/api', apiKeyAuth);

// Rutas que requieren API key
app.use('/api', ticketsRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`CORS enabled for: ${FRONTEND_ORIGIN}`);
  console.log(`MongoDB URI: ${MONGODB_URI}`);
});