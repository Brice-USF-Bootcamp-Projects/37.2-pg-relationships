// tests/companies.test.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");

jest.spyOn(console, 'error').mockImplementation(() => {});

beforeEach(async () => {
  // Clear invoices first if they reference companies
  await db.query("DELETE FROM invoices");
  // Clear companies table
  await db.query("DELETE FROM companies");
  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES 
    ('apple', 'Apple', 'Maker of iPhones'),
    ('ibm', 'IBM', 'Big Blue');
  `);
});


afterAll(async () => {
  await db.end();
});

describe("GET /companies", () => {
  test("Gets a list of companies", async () => {
    const res = await request(app).get("/companies");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      companies: [
        { code: "apple", name: "Apple", description: "Maker of iPhones" },
        { code: "ibm", name: "IBM", description: "Big Blue" },
      ],
    });
  });
});

describe("GET /companies/:code", () => {
  test("Gets a single company", async () => {
    const res = await request(app).get("/companies/apple");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({
      company: { code: "apple", name: "Apple", description: "Maker of iPhones" },
    });
  });

  test("Responds with 404 for invalid company code", async () => {
    const res = await request(app).get("/companies/invalid");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Company with code of invalid does not exist.",
        status: 404,
      },
      message: "Company with code of invalid does not exist.",
    });
  });
});

describe("POST /companies", () => {
  test("Creates a new company", async () => {
    const res = await request(app)
      .post("/companies")
      .send({ code: "testco", name: "TestCo", description: "Testing Inc." });
    expect(res.statusCode).toBe(201);
    expect(res.body).toEqual({
      company: { code: "testco", name: "TestCo", description: "Testing Inc." },
    });
  });

  test("Responds with 400 for missing fields", async () => {
    const res = await request(app).post("/companies").send({ name: "TestCo" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({
      error: {
        message: "Code, name, and description are required",
        status: 400,
      },
      message: "Code, name, and description are required",
    });
  });
});

describe("DELETE /companies/:code", () => {
  test("Deletes a company", async () => {
    const res = await request(app).delete("/companies/apple");
    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ status: "deleted" });
  });

  test("Responds with 404 for invalid company code", async () => {
    const res = await request(app).delete("/companies/invalid");
    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({
      error: {
        message: "Company with code invalid does not exist.",
        status: 404,
      },
      message: "Company with code invalid does not exist.",
    });
  });
});
