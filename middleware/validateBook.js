// Fields the client is allowed to send. The server sets _id, createdAt and updatedAt.
export const FIELDS = ['title', 'author', 'year', 'genre', 'read'];

const LIMITS = { title: 200, author: 100, genre: 50 };

// Validation middleware for create/update routes.
// mode = 'full'    -> POST and PUT: title and author are required
// mode = 'partial' -> PATCH: only the fields sent are checked, at least one is needed
export function validateBook(mode) {
  return (req, res, next) => {
    const body = req.body;

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ error: 'Request body must be a JSON object' });
    }

    const errors = [];

    for (const field of ['title', 'author']) {
      const value = body[field];
      if (value === undefined) {
        if (mode === 'full') errors.push(`${field} is required`);
      } else if (typeof value !== 'string' || value.trim() === '') {
        errors.push(`${field} must be a non-empty string`);
      } else if (value.trim().length > LIMITS[field]) {
        errors.push(`${field} must be at most ${LIMITS[field]} characters`);
      }
    }

    if (body.year !== undefined) {
      const thisYear = new Date().getFullYear();
      if (!Number.isInteger(body.year) || body.year < 0 || body.year > thisYear) {
        errors.push(`year must be a whole number between 0 and ${thisYear}`);
      }
    }

    if (body.genre !== undefined) {
      if (typeof body.genre !== 'string') {
        errors.push('genre must be a string');
      } else if (body.genre.trim().length > LIMITS.genre) {
        errors.push(`genre must be at most ${LIMITS.genre} characters`);
      }
    }

    if (body.read !== undefined && typeof body.read !== 'boolean') {
      errors.push('read must be true or false');
    }

    if (mode === 'partial' && !FIELDS.some((f) => body[f] !== undefined)) {
      errors.push(`send at least one of: ${FIELDS.join(', ')}`);
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }
    next();
  };
}
