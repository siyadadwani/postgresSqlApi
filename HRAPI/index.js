const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();


const app = express();
// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));  // Serve static frontend files

// Test GET route
app.get('/', (req, res) => {
  res.send('Server is running!');
});



// Add book to database
app.post('/books', async (req, res) => {
  try {
    console.log('Received POST /books:', req.body); // LOG request

    const { title, author, genre, copies } = req.body;

    const newBook = await pool.query(
      `INSERT INTO books (title, author, genre, copies) VALUES ($1, $2, $3, $4) RETURNING *`,
      [title, author, genre, copies]
    );

    res.status(201).json(newBook.rows[0]);
  } catch (err) {
    console.error('Database Insert Error:', err); // LOG the real error
    res.status(500).json({ error: 'Server Error' });
  }
});



// GET endpoint to get all books
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY book_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error while fetching books' });
  }
});




app.post('/members', async (req, res) => {
  try {
    console.log('Received POST /members:', req.body);

    const { name, email, membership_date } = req.body;  // no member_id here

    const newMember = await pool.query(
      `INSERT INTO members (name, email, membership_date) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, membership_date]
    );

    res.status(201).json(newMember.rows[0]);  // this includes generated member_id
  } catch (err) {
    console.error('Database Insert Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});


// GET endpoint to get all members
app.get('/members', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM members ORDER BY member_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Database error while fetching members' });
  }
});




app.post('/issuebook', async (req, res) => {
  try {
    console.log('Received POST /issuebook:', req.body);

    const { book_id, member_id, issue_date, due_date } = req.body;

    const newIssue = await pool.query(
      `INSERT INTO issuebook (member_id, book_id, issue_date, due_date) VALUES ($1, $2, $3, $4) RETURNING *`,
      [book_id, member_id, issue_date, due_date ]
    );

    res.status(201).json(newIssue.rows[0]);
  } catch (err) {
    console.error('Database Insert Error (issuebook):', err.stack);
    res.status(500).json({ error: 'Server Error' });
  }
});


// GET endpoint to get all issued book records
app.get('/issuebook', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM issuebook ORDER BY issue_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching issuebook records:', err);
    res.status(500).json({ error: 'Database error while fetching issued books' });
  }
});





app.post('/returnbook', async (req, res) => {
  try {
    const { member_id, book_id, return_date } = req.body;

    // Check if the book is currently issued (exists in issuebook)
    const checkIssue = await pool.query(
      `SELECT * FROM issuebook WHERE member_id = $1 AND book_id = $2`,
      [member_id, book_id]
    );

    if (checkIssue.rows.length === 0) {
      return res.status(400).json({ error: 'No issued record found for this member and book' });
    }

    // Insert into returnbook table
    const newReturn = await pool.query(
      `INSERT INTO returnbook (member_id, book_id, return_date) VALUES ($1, $2, $3) RETURNING *`,
      [member_id, book_id, return_date]
    );

    res.status(201).json(newReturn.rows[0]);
  } catch (err) {
    console.error('Database Insert Error (returnbook):', err.stack);
    res.status(500).json({ error: 'Server Error' });
  }
});
app.get('/returnbook', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM returnbook ORDER BY return_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching returnbook records:', err);
    res.status(500).json({ error: 'Database error while fetching returned books' });
  }
});

// count 
app.get("/count", async (req, res) => {
  try {
    const books = await pool.query("SELECT COUNT(*) FROM books");
    const members = await pool.query("SELECT COUNT(*) FROM members");
    const issued = await pool.query("SELECT COUNT(*) FROM issuebook");
    const returned = await pool.query("SELECT COUNT(*) FROM returnbook WHERE return_date IS NOT NULL");

    res.json({
      totalBooks: parseInt(books.rows[0].count),
      totalMembers: parseInt(members.rows[0].count),
      booksIssued: parseInt(issued.rows[0].count),
      booksReturned: parseInt(returned.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});




app.post('/locations', async (req, res) => {
  try {
    const { name, address } = req.body;
    console.log('Received:', req.body);

    if (!name || !address) {
      return res.status(400).json({ error: 'Both name and address are required' });
    }

    const newLocation = await pool.query(
      `INSERT INTO locations (name, address) VALUES ($1, $2) RETURNING *`,
      [name, address]
    );

    res.status(201).json(newLocation.rows[0]);
  } catch (err) {
    console.error('Database Insert Error (locations):', err.stack);
    res.status(500).json({ error: 'Server Error' });
  }
});


// GET all locations
app.get('/locations', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM locations ORDER BY location_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching locations:', err);
    res.status(500).json({ error: 'Database error while fetching locations' });
  }
});


// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
