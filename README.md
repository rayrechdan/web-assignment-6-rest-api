# Assignment 6 - REST API Project (Books)

A RESTful API for a personal reading list, built with **Node.js** and **Express** and backed by **MongoDB** (Mongoose). It manages one resource, **books**, with full CRUD. Data is stored in the database, so it survives a server restart.

Raymond Rechdan - Web Programming

## Requirements

- Node.js 18 or newer
- A MongoDB database: a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster, or MongoDB running locally

## Setup and run

```bash
# 1. Install dependencies
npm install

# 2. Create your .env file from the example, then put your connection string in it
cp .env.example .env

# 3. Start the dev server (restarts on file changes)
npm run dev
```

`.env` needs two values:

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/books_api
PORT=3000
```

For a local MongoDB use `MONGODB_URI=mongodb://127.0.0.1:27017/books_api`.

When it works the terminal prints:

```
Connected to MongoDB
Server running on http://localhost:3000
```

`npm start` runs the server without watch mode.

## Project structure

```
server.js                    Express app: middleware, routes, error handler, DB connection
models/Book.js               Mongoose schema and model
routes/books.js              The six /api/books routes
middleware/validateBook.js   Input validation for POST, PUT and PATCH
postman/                     Postman collection that tests every route
.env.example                 Template for the environment variables
```

## The book resource

| Field       | Type    | Rules                                   | Set by |
|-------------|---------|-----------------------------------------|--------|
| `_id`       | string  | MongoDB ObjectId                        | server |
| `title`     | string  | required, 1–200 characters              | client |
| `author`    | string  | required, 1–100 characters              | client |
| `year`      | number  | optional, whole number, 0 to this year  | client |
| `genre`     | string  | optional, up to 50 characters, default `""` | client |
| `read`      | boolean | optional, default `false`               | client |
| `createdAt` | date    | automatic                               | server |
| `updatedAt` | date    | automatic                               | server |

Fields the client is not allowed to set (`_id`, `createdAt`, `updatedAt`) and unknown fields are ignored.

## Routes

Base URL: `http://localhost:3000/api`

| Method | Path          | Description                 | Success          | Errors      |
|--------|---------------|-----------------------------|------------------|-------------|
| GET    | `/books`      | List all books              | 200              | 500         |
| GET    | `/books/:id`  | Get one book                | 200              | 400, 404    |
| POST   | `/books`      | Create a book               | 201              | 400         |
| PUT    | `/books/:id`  | Replace a book              | 200              | 400, 404    |
| PATCH  | `/books/:id`  | Update some fields          | 200              | 400, 404    |
| DELETE | `/books/:id`  | Delete a book               | 204 (no body)    | 400, 404    |

### GET /api/books

Returns every book, newest first.

```bash
curl http://localhost:3000/api/books
```

**200 OK**

```json
[
  {
    "_id": "6730f1c2e4b7a1d3f0c8e2a9",
    "title": "The Pragmatic Programmer",
    "author": "Andrew Hunt and David Thomas",
    "year": 1999,
    "genre": "Programming",
    "read": false,
    "createdAt": "2026-11-09T20:15:02.112Z",
    "updatedAt": "2026-11-09T20:15:02.112Z"
  }
]
```

An empty database returns `[]`.

### GET /api/books/:id

```bash
curl http://localhost:3000/api/books/6730f1c2e4b7a1d3f0c8e2a9
```

**200 OK** – the book object (same shape as above).

**404 Not Found**

```json
{ "error": "Book not found" }
```

**400 Bad Request** – the id is not a valid ObjectId (for example `/api/books/123`)

```json
{ "error": "Invalid id" }
```

### POST /api/books

`title` and `author` are required.

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Content-Type: application/json" \
  -d '{"title":"The Pragmatic Programmer","author":"Andrew Hunt and David Thomas","year":1999,"genre":"Programming"}'
```

Request body:

```json
{
  "title": "The Pragmatic Programmer",
  "author": "Andrew Hunt and David Thomas",
  "year": 1999,
  "genre": "Programming"
}
```

**201 Created**

```json
{
  "_id": "6730f1c2e4b7a1d3f0c8e2a9",
  "title": "The Pragmatic Programmer",
  "author": "Andrew Hunt and David Thomas",
  "year": 1999,
  "genre": "Programming",
  "read": false,
  "createdAt": "2026-11-09T20:15:02.112Z",
  "updatedAt": "2026-11-09T20:15:02.112Z"
}
```

**400 Bad Request** – invalid input. Every problem is listed in `details`:

```json
{
  "error": "Validation failed",
  "details": ["title is required", "year must be a whole number between 0 and 2026"]
}
```

**400 Bad Request** – the body is not valid JSON:

```json
{ "error": "Malformed JSON in request body" }
```

### PUT /api/books/:id

Replaces the whole book. `title` and `author` are required; optional fields that are not sent go back to their defaults (`year` is removed, `genre` becomes `""`, `read` becomes `false`).

```bash
curl -X PUT http://localhost:3000/api/books/6730f1c2e4b7a1d3f0c8e2a9 \
  -H "Content-Type: application/json" \
  -d '{"title":"The Pragmatic Programmer (20th Anniversary Edition)","author":"David Thomas and Andrew Hunt","year":2019,"genre":"Programming","read":true}'
```

**200 OK**

```json
{
  "_id": "6730f1c2e4b7a1d3f0c8e2a9",
  "title": "The Pragmatic Programmer (20th Anniversary Edition)",
  "author": "David Thomas and Andrew Hunt",
  "year": 2019,
  "genre": "Programming",
  "read": true,
  "createdAt": "2026-11-09T20:15:02.112Z",
  "updatedAt": "2026-11-09T20:18:40.530Z"
}
```

Errors: **400** (invalid id or invalid body, same format as POST), **404** `{ "error": "Book not found" }`.

### PATCH /api/books/:id

Changes only the fields that are sent. At least one field is required.

```bash
curl -X PATCH http://localhost:3000/api/books/6730f1c2e4b7a1d3f0c8e2a9 \
  -H "Content-Type: application/json" \
  -d '{"read":true}'
```

**200 OK** – the updated book; every other field is unchanged.

**400 Bad Request** – empty body:

```json
{
  "error": "Validation failed",
  "details": ["send at least one of: title, author, year, genre, read"]
}
```

Errors: **400** (invalid id or invalid field), **404** `{ "error": "Book not found" }`.

### DELETE /api/books/:id

```bash
curl -i -X DELETE http://localhost:3000/api/books/6730f1c2e4b7a1d3f0c8e2a9
```

**204 No Content** – deleted, empty body.

Errors: **400** `{ "error": "Invalid id" }`, **404** `{ "error": "Book not found" }`.

### Unknown routes

Any other path returns **404**:

```json
{ "error": "Route GET /api/unknown not found" }
```

## Error handling

- Invalid input on POST, PUT and PATCH is rejected by the validation middleware with **400** and a list of messages.
- An id that is not a valid ObjectId returns **400**; a valid id that doesn't exist returns **404**.
- Malformed JSON returns **400** instead of crashing.
- Any unexpected error is caught by the error handler and returns **500** `{ "error": "Internal server error" }`. The server keeps running.
- If `MONGODB_URI` is missing or the database can't be reached at startup, the server prints the reason and stops.

## Testing with Postman

The collection is in `postman/books-api.postman_collection.json`.

1. In Postman: **Import** → select the file.
2. Start the server (`npm run dev`).
3. Open the collection → **Run** to run every request in order.

The collection has 15 requests in three folders, each with test assertions on the status code and body:

1. **Success cases** – create, list, get one, PUT, PATCH. "Create a book" saves the new id into the `{{bookId}}` variable that the other requests use.
2. **Error cases** – missing title, wrong types, malformed JSON, empty PATCH, invalid id, unknown id.
3. **Delete** – delete (204), then get and delete again (both 404).

`{{baseUrl}}` defaults to `http://localhost:3000/api`; change it in the collection variables if you use another port.
