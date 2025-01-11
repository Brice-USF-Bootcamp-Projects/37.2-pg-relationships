// routes/companies.js

const express = require("express");
const ExpressError = require("../expressError")
const router = express.Router();
const db = require("../db");
const slugify = require("slugify");


router.get('/', async (req, res, next) => {
    try {
      const results = await db.query(`SELECT * FROM companies`);
      return res.json({ companies: results.rows })
    } catch (e) {
      return next(e);
    }
  })



  router.get("/:code", async (req, res, next) => {
    try {
      const { code } = req.params;
  
      // Fetch company details
      const companyResult = await db.query(
        `SELECT code, name, description FROM companies WHERE code = $1`,
        [code]
      );
  
      if (companyResult.rows.length === 0) {
        throw new ExpressError(`Company with code '${code}' not found`, 404);
      }
  
      // Fetch associated industries
      const industryResult = await db.query(
        `SELECT i.industry
         FROM industries AS i
         JOIN company_industries AS ci ON i.code = ci.industry_code
         WHERE ci.company_code = $1`,
        [code]
      );
  
      const company = companyResult.rows[0];
      company.industries = industryResult.rows.map((row) => row.industry);
  
      return res.json({ company });
    } catch (err) {
      return next(err);
    }
  });
  


router.post('/', async (req, res, next) => {
  try {
    const { code, name, description } = req.body;

    // Validate input
    if (!code || !name || !description) {
      throw new ExpressError("Code, name, and description are required", 400);
    }

    // use slugify to remove any unwanted characters
    const sanitizedCode = slugify(code, {
      replacement: '-', // replace spaces and special characters with dashes
      remove: /[*+~.()'"!:@]/g, // remove specific unwanted characters
      lower: true, // convert to lowercase
      strict: true // strip other special characters
    });

    // Insert into the database
    const result = await db.query(
      'INSERT INTO companies (code, name, description) VALUES ($1, $2, $3) RETURNING *',
      [sanitizedCode, name, description]
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


router.get("/industries", async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT i.code, i.industry, 
              json_agg(ci.company_code) AS companies
       FROM industries AS i
       LEFT JOIN company_industries AS ci ON i.code = ci.industry_code
       GROUP BY i.code`
    );

    return res.json({ industries: result.rows });
  } catch (err) {
    return next(err);
  }
});



router.post("/industries", async (req, res, next) => {
  try {
    const { code, industry } = req.body;

    if (!code || !industry) {
      throw new ExpressError("Code and industry are required fields", 400);
    }

    const result = await db.query(
      `INSERT INTO industries (code, industry)
       VALUES ($1, $2)
       RETURNING code, industry`,
      [code, industry]
    );

    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});


router.post("/industries/:industryCode/companies/:companyCode", async (req, res, next) => {
  try {
    const { industryCode, companyCode } = req.params;

    await db.query(
      `INSERT INTO company_industries (company_code, industry_code)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`, // Avoid duplicate entries
      [companyCode, industryCode]
    );

    return res.status(201).json({ message: "Industry associated with company" });
  } catch (err) {
    return next(err);
  }
});


module.exports = router;