/** db.js */

const { Client } = require("pg");

const client = new Client({
  // connectionString: "postgresql:///biztime"
  connectionString: process.env.DATABASE_URL || "postgresql:///biztime",
});

client.connect();


module.exports = client;