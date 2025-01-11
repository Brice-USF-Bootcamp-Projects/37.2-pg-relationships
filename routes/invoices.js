// routes/invoices.js

const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();
const db = require("../db");

// Return info on invoices: {invoices: [{id, comp_code, amt, paid, add_date, paid_date}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices`
    );
    return res.json({ invoices: results.rows });
  } catch (e) {
    return next(e);
  }
});

// Return detailed obj on given invoice, including company details
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const invoiceResult = await db.query(
      `SELECT id, comp_code, amt, paid, add_date, paid_date FROM invoices WHERE id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      throw new ExpressError(`Invoice with id of ${id} does not exist`, 404);
    }

    const companyResult = await db.query(
      `SELECT code, name, description FROM companies WHERE code = $1`,
      [invoiceResult.rows[0].comp_code]
    );

    const invoice = invoiceResult.rows[0];
    invoice.company = companyResult.rows[0];

    return res.json({ invoice });
  } catch (e) {
    return next(e);
  }
});

// Add a new invoice
router.post("/", async (req, res, next) => {
  try {
    const { comp_code, amt } = req.body;

    if (!comp_code || amt === undefined) {
      throw new ExpressError("comp_code and amt are required", 400);
    }

    const companyCheck = await db.query(
      `SELECT code FROM companies WHERE code = $1`,
      [comp_code]
    );

    if (companyCheck.rows.length === 0) {
      throw new ExpressError(`Company with code of ${comp_code} does not exist`, 404);
    }

    const result = await db.query(
      `INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date) 
       VALUES ($1, $2, false, CURRENT_DATE, null) 
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [comp_code, amt]
    );

    return res.status(201).json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});

// Update an existing invoice
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params; // Extract invoice ID from the route parameter
    const { amt, paid } = req.body; // Extract amt and paid from the request body

    // Validate that both fields are present
    if (amt === undefined || paid === undefined) {
      throw new ExpressError("amt and paid are required fields", 400);
    }

    // Check if the invoice exists and get its current status
    const currInvoice = await db.query(
      `SELECT paid, paid_date FROM invoices WHERE id = $1`,
      [id]
    );

    if (currInvoice.rows.length === 0) {
      throw new ExpressError(`Invoice with id '${id}' does not exist.`, 404);
    }

    // Determine the new `paid_date` value
    const currPaid = currInvoice.rows[0].paid;
    const currPaidDate = currInvoice.rows[0].paid_date;
    let paidDate = currPaidDate; // Default: keep the current `paid_date`

    if (!currPaid && paid) {
      // Transition from unpaid to paid
      paidDate = new Date(); // Set to today's date
    } else if (currPaid && !paid) {
      // Transition from paid to unpaid
      paidDate = null; // Set to null
    }

    // Update the invoice in the database
    const result = await db.query(
      `UPDATE invoices
       SET amt = $1, paid = $2, paid_date = $3
       WHERE id = $4
       RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [amt, paid, paidDate, id]
    );

    // Respond with the updated invoice
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});


// Delete an invoice
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice with id '${id}' does not exist.`, 404);
    }

    return res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});

module.exports = router;
