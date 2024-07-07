const mysql = require('mysql2');// Write in your terminal npm install mysql2
const schedule = require('node-schedule'); // Write in your terminal npm install schedule or schedule.js

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'YOUR_DB'
});