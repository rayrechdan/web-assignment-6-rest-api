import 'dotenv/config'; // first line: load .env before anything reads it
import express from 'express';
import mongoose from 'mongoose';
import booksRouter from './routes/books.js';

const dbUri = process.env.MONGODB_URI;
const port = Number(process.env.PORT) || 3000;

const app = express();

// Middleware: parse JSON bodies (must come before the routes)
app.use(express.json());

// Routes
app.use('/api/books', booksRouter);

// Any other path -> 404 in JSON
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Error handler: catches malformed JSON, bad data and unexpected errors
// so the server never crashes and always answers in JSON.
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Malformed JSON in request body' });
  }
  if (err instanceof mongoose.Error.ValidationError) {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details });
  }
  if (err instanceof mongoose.Error.CastError) {
    return res.status(400).json({ error: `Invalid value for ${err.path}` });
  }
  if (err.status >= 400 && err.status < 500) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Connect first, then listen
if (!dbUri) {
  console.error('MONGODB_URI is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

try {
  await mongoose.connect(dbUri);
  console.log('Connected to MongoDB');
  app.listen(port, () => console.log(`Server running on http://localhost:${port}`));
} catch (err) {
  console.error('DB connection failed:', err.message);
  process.exit(1);
}
