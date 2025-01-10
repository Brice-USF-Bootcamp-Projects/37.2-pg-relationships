// tests/invoices.test.js

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
  await db.query("TRUNCATE invoices RESTART IDENTITY CASCADE");
  await db.query("TRUNCATE companies RESTART IDENTITY CASCADE");

  await db.query(`
    INSERT INTO companies (code, name, description)
    VALUES ('apple', 'Apple', 'Maker of iPhones'),
           ('ibm', 'IBM', 'Big Blue');
  `);

  await db.query(`
    INSERT INTO invoices (comp_code, amt, paid, add_date, paid_date)
    VALUES ('apple', 100, false, CURRENT_DATE, null),
           ('ibm', 200, true, CURRENT_DATE, CURRENT_DATE);
  `);
});

afterEach(async () => {
  await db.query("TRUNCATE invoices RESTART IDENTITY CASCADE");
  await db.query("TRUNCATE companies RESTART IDENTITY CASCADE");
});

afterAll(async () => {
  await db.end();
});

describe("GET /invoices", () => {
  test("Gets a list of invoices", async () => {
    const res = await request(app).get("/invoices");
    expect(res.statusCode).toBe(200);
    expect(res.body.invoices.length).toBe(2);
  });
});

describe("GET /invoices/:id", () => {
  test("Gets a single invoice", async () => {
    const res = await request(app).get("/invoices/1");
    expect(res.statusCode).toBe(200);
    expect(res.body.invoice.id).toBe(1);
  });
});

describe("POST /invoices", () => {
  test("Creates a new invoice", async () => {
    const res = await request(app)
      .post("/invoices")
      .send({ comp_code: "apple", amt: 300 });
    expect(res.statusCode).toBe(201);
  });
});


