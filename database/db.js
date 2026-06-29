const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./usuarios.db");

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS usuarios(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT NOL NULL,
        foto TEXT
    )
        `);
});

module.exports = db;
