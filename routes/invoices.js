// routes/invoices.js

const express = require("express");
const ExpressError = require('../expressError')
const router = express.Router();
const db = require('../db')

// Return info on invoices: like {invoices: [{id, comp_code}, ...]}
router.get("/", async (req, res, next) => {
  try {
    const results = await db.query('SELECT * FROM invoices');
    return res.json({ invoices: results.rows })
  } catch (e) {
    return next (e)
  }
});

// Returns obj on given invoice.
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const results = await db.query ('SELECT * FROM invoices WHERE id = $1', [id])
    if (results.rows.length === 0) {
      throw new ExpressError(`Invoice with id of ${ id } does not exist`, 404)
    }
    return res.send({invoice: results.rows[0] })
  } catch (e) { 
    return next (e)
  }
})


/** Adds an invoice. Needs to be passed in JSON body of: {comp_code, amt}
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}} **/
router.put('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { comp_code, amt, paid, add_date, paid_date } = req.body;

    // Validate that at least one field is provided
    if (!comp_code && amt === undefined && paid === undefined && !add_date && !paid_date) {
      throw new ExpressError("At least one field must be provided to update.", 400);
    }

    // Dynamically build the update query
    const fields = [];
    const values = [];
    let queryIdx = 1;

    if (comp_code) {
      fields.push(`comp_code = $${queryIdx++}`);
      values.push(comp_code);
    }
    if (amt !== undefined) {
      fields.push(`amt = $${queryIdx++}`);
      values.push(amt);
    }
    if (paid !== undefined) {
      fields.push(`paid = $${queryIdx++}`);
      values.push(paid);
    }
    if (add_date) {
      const validAddDate = new Date(add_date);
      if (isNaN(validAddDate)) {
        throw new ExpressError("Invalid add_date format. Must be a valid date.", 400);
      }
      fields.push(`add_date = $${queryIdx++}`);
      values.push(validAddDate);
    }
    if (paid_date) {
      const validPaidDate = new Date(paid_date);
      if (isNaN(validPaidDate)) {
        throw new ExpressError("Invalid paid_date format. Must be a valid date.", 400);
      }
      fields.push(`paid_date = $${queryIdx++}`);
      values.push(validPaidDate);
    }

    // Ensure we have fields to update
    if (fields.length === 0) {
      throw new ExpressError("No valid fields to update.", 400);
    }

    // Add the ID to the values array
    values.push(id);

    // Execute the dynamic update query
    const result = await db.query(
      `UPDATE invoices
       SET ${fields.join(", ")}
       WHERE id = $${queryIdx}
       RETURNING *`,
      values
    );

    // Check if the invoice exists
    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice with id '${id}' does not exist.`, 404);
    }

    // Return the updated invoice
    res.json({ invoice: result.rows[0] });
  } catch (e) {
    return next(e);
  }
});


router.delete('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    // Attempt to delete the invoice
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [id]
    );

    // Check if the invoice was found and deleted
    if (result.rows.length === 0) {
      throw new ExpressError(`Invoice with id '${id}' does not exist.`, 404);
    }

    // Return success message
    res.json({ status: "deleted" });
  } catch (e) {
    return next(e);
  }
});




module.exports = router;