// routes/companies.js

const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");


router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT * FROM companies`);
      return res.json({ companies: results.rows })
    } catch (e) {
      return next(e);
    }
  })



router.get('/:code', async (req, res, next) => {
  try {
    const { code } = req.params;
    const results = await db.query ('SELECT * FROM companies WHERE code =$1', [code])
    if (results.rows.length === 0) {
      throw new ExpressError(`Company with code of ${code} does not exist.`, 404)
    }
    return res.send({ company: results.rows[0] })
  } catch (e) {
    return next (e)
  }
})


router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    // Validate input
    if (!code || !name || !description) {
      throw new ExpressError("Code, name, and description are required", 400);
    }

    // Insert into the database
    const result = await db.query(
      'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *',
      [code, name, description]
    );

    // Return the newly created company
    res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    next(err);
  }
});


// Update an existing company
router.put('/:code', async (req, res, next) => {
  try {
      const { code } = req.params;
      const { name, description } = req.body;

      // Validate input
      if (!name || !description) {
          throw new ExpressError("Name and description are required", 400);
      }

      // Update the database
      const result = await db.query(
          'UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING *',
          [name, description, code]
      );

      // Check if the company exists
      if (result.rows.length === 0) {
          throw new ExpressError(`Company with code ${code} does not exist.`, 404);
      }

      // Return the updated company
      res.json({ company: result.rows[0] });
  } catch (e) {
      return next(e);
  }
});

// Delete a company
router.delete('/:code', async (req, res, next) => {
  try {
      const { code } = req.params;

      // Delete from the database
      const result = await db.query('DELETE FROM companies WHERE code = $1 RETURNING *', [code]);

      // Check if the company exists
      if (result.rows.length === 0) {
          throw new ExpressError(`Company with code ${code} does not exist.`, 404);
      }

      // Return success message
      res.json({ status: "deleted" });
  } catch (e) {
      return next(e);
  }
});

module.exports = router;