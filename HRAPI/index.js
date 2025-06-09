const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const path = require('path');
const app = express();
app.use('/HRAPI', express.static(path.join(__dirname, 'public')));
// app.listen(3000, () => {
//   console.log('Server started on port 3000');
// });



// Middleware
app.use(cors());
app.use(express.json());
//app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static('public'));  // Serve static frontend files
app.use('/HRAPI', express.static(path.join(__dirname, 'public', 'HRAPI')));
// Test GET route
app.get('/', (req, res) => {
  res.send('Server is running!');
});




// POST /books — Add a new book
app.post('/books', async (req, res) => {
  try {
    console.log('POST /books body:', req.body);

    const { title, author_id, category_id, location_id, genre, copies, staff_id, fine_id } = req.body;

    if (!title || !author_id || !category_id || !location_id || !genre || copies == null || !staff_id || !fine_id) {
      return res.status(400).json({ error: 'Missing required book fields' });
    }

    const result = await pool.query(
      `INSERT INTO books (title, author_id, category_id, location_id, genre, copies, staff_id, fine_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [title, author_id, category_id, location_id, genre, copies, staff_id, fine_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database Insert Error:', err);
    res.status(500).json({ error: 'Server Error while adding book' });
  }
});

// GET /books — Retrieve all books
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM books ORDER BY book_id`);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Database error while fetching books' });
  }
});




app.post('/members', async (req, res) => {
  try {
    console.log('POST /members body:', req.body);

    const { name, email, membership_date } = req.body;

    if (!name || !email || !membership_date) {
      return res.status(400).json({ error: 'Missing required member fields' });
    }

    const newMember = await pool.query(
      `INSERT INTO members (name, email, membership_date) VALUES ($1, $2, $3) RETURNING *`,
      [name, email, membership_date]
    );

    res.status(201).json(newMember.rows[0]);
  } catch (err) {
    console.error('Database Insert Error:', err);
    res.status(500).json({ error: 'Server Error' });
  }
});


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


app.get('/returnbook', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM returnbook ORDER BY return_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching returnbook records:', err);
    res.status(500).json({ error: 'Database error while fetching returned books' });
  }
});


app.post('/returnbook', async (req, res) => {
  const client = await pool.connect();  // Use a client for transaction

  try {
    const { member_id, book_id, return_date } = req.body;

    if (!member_id || !book_id || !return_date) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    await client.query('BEGIN');  // Start transaction

    // Check if book is issued
    const checkIssue = await client.query(
      'SELECT * FROM issuebook WHERE member_id = $1 AND book_id = $2',
      [member_id, book_id]
    );
    if (checkIssue.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'No issued record found for this member and book' });
    }

    // Check if already returned
    const checkReturn = await client.query(
      'SELECT * FROM returnbook WHERE member_id = $1 AND book_id = $2',
      [member_id, book_id]
    );
    if (checkReturn.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Book already returned' });
    }

    // Insert into returnbook
    const newReturn = await client.query(
      `INSERT INTO returnbook (member_id, book_id, return_date) VALUES ($1, $2, $3) RETURNING *`,
      [member_id, book_id, return_date]
    );

    // Delete from issuebook after successful return
    await client.query(
      'DELETE FROM issuebook WHERE member_id = $1 AND book_id = $2',
      [member_id, book_id]
    );

    await client.query('COMMIT');  // Commit transaction

    res.status(201).json(newReturn.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Database Insert Error (returnbook):', err.stack);
    res.status(500).json({ error: 'Server Error' });
  } finally {
    client.release();
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

  
// Add a new category
app.post('/categories', async (req, res) => {
  try {
    const { category_name } = req.body;

    const insertCategory = await pool.query(
      `INSERT INTO categories (category_name) VALUES ($1) RETURNING *`,
      [category_name]
    );

    res.status(201).json(insertCategory.rows[0]);
  } catch (err) {
    console.error('Error adding category:', err.stack);
    if (err.code === '23505') {
      // Unique violation
      res.status(400).json({ error: 'Category already exists.' });
    } else {
      res.status(500).json({ error: 'Server error while adding category.' });
    }
  }
});

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category_id, category_name, created_at FROM categories ORDER BY category_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching categories:', err.stack);
    res.status(500).json({ error: 'Database error while fetching categories' });
  }
});

// Add a new author
app.post('/authors', async (req, res) => {
  try {
    const { author_name } = req.body;

    const insertAuthor = await pool.query(
      `INSERT INTO author (author_name) VALUES ($1) RETURNING *`,
      [author_name]
    );

    res.status(201).json(insertAuthor.rows[0]);
  } catch (err) {
    console.error('Error adding author:', err.stack);
    if (err.code === '23505') {
      // Unique violation (author_name already exists)
      res.status(400).json({ error: 'Author already exists.' });
    } else {
      res.status(500).json({ error: 'Server error while adding author.' });
    }
  }
});

// Get all authors
app.get('/authors', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT author_id, author_name FROM author ORDER BY author_id`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching authors:', err.stack);
    res.status(500).json({ error: 'Database error while fetching authors' });
  }
});
app.get('/author', (req, res) => {
  res.redirect('/authors');
});

app.post('/staff', async (req, res) => {
  const { name, email, phone, role, password } = req.body;
  console.log("Incoming data:", req.body);

  try {
    const result = await pool.query(
      `INSERT INTO staff (name, email, phone, role, password)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, email, phone, role, password]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to add staff' });
  }
});


// GET to fetch all staff members
app.get('/staff', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM staff ORDER BY staff_id');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching staff:', err);
    res.status(500).json({ error: 'Database error while fetching staff' });
  }
});
 
// POST to create a new fine
app.post('/fines', async (req, res) => {
  const { member_id, book_id, issue_id, fine_amount, fine_reason, fine_date, status } = req.body;
  console.log("Incoming fine data:", req.body);

  try {
    const result = await pool.query(
      `INSERT INTO fines (member_id, book_id, issue_id, fine_amount, fine_reason, fine_date, status)
       VALUES ($1, $2, $3, $4, $5, COALESCE($6, CURRENT_DATE), COALESCE($7, 'Unpaid'))
       RETURNING *`,
      [member_id, book_id, issue_id, fine_amount, fine_reason, fine_date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Failed to add fine' });
  }
});

// GET to fetch all fines
app.get('/fines', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM fines ORDER BY fine_id');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching fines:', error);
    res.status(500).json({ error: 'Database error while fetching fines' });
  }
});

// chart
app.get('/api/most-borrowed-books', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT b.title, COUNT(*) AS borrow_count
      FROM issuebooks i
      JOIN books b ON i.book_id = b.book_id
      GROUP BY b.title
      ORDER BY borrow_count DESC
      LIMIT 5
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching most borrowed books:', err);
    res.status(500).json({ error: 'Database error while fetching report' });
  }
});

// Start server
const PORT = process.env.PORT || 5005;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
