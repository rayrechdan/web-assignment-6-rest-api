import express from 'express';
import mongoose from 'mongoose';
import { Book } from '../models/Book.js';
import { validateBook, FIELDS } from '../middleware/validateBook.js';

const router = express.Router();

// Every route with :id first checks that the id is a valid ObjectId -> 400 if not
router.param('id', (req, res, next, id) => {
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  next();
});

// GET /api/books -> list all books (newest first)
router.get('/', async (req, res, next) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 });
    res.status(200).json(books);
  } catch (err) {
    next(err);
  }
});

// GET /api/books/:id -> one book
router.get('/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
});

// POST /api/books -> create a book
router.post('/', validateBook('full'), async (req, res, next) => {
  try {
    const data = {};
    for (const f of FIELDS) {
      if (req.body[f] !== undefined) data[f] = req.body[f];
    }
    const book = await Book.create(data);
    res.status(201).json(book);
  } catch (err) {
    next(err);
  }
});

// PUT /api/books/:id -> replace the whole book (fields not sent go back to their defaults)
router.put('/:id', validateBook('full'), async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    book.title = req.body.title;
    book.author = req.body.author;
    book.year = req.body.year; // undefined removes it
    book.genre = req.body.genre ?? '';
    book.read = req.body.read ?? false;

    await book.save(); // runs the schema validators
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
});

// PATCH /api/books/:id -> change only the fields sent
router.patch('/:id', validateBook('partial'), async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });

    for (const f of FIELDS) {
      if (req.body[f] !== undefined) book[f] = req.body[f];
    }

    await book.save();
    res.status(200).json(book);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/books/:id -> 204 with no body
router.delete('/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: 'Book not found' });
    res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

export default router;
