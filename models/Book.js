import mongoose from 'mongoose';

const bookSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, 'title is required'], trim: true, maxlength: 200 },
    author: { type: String, required: [true, 'author is required'], trim: true, maxlength: 100 },
    year: { type: Number, min: 0, max: 2100 },
    genre: { type: String, trim: true, maxlength: 50, default: '' },
    read: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false } // adds createdAt and updatedAt
);

// Model Book -> collection "books"
export const Book = mongoose.model('Book', bookSchema);
