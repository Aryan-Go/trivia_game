import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();
const user = process.env.user;
const localhost = process.env.localhost;
const password = process.env.password;
const database = process.env.database;

const db = await mysql.createConnection({
    localhost: localhost,
    password: password,
    user: user,
    database: database
})

export const insert_data = async (email, username, password, score) => {
    await db.query(`INSERT INTO user (username,email,password,score) VALUES (?,?,?,?)`, [username, email, password, score]);
    console.log("Data has been added");
}

export const get_data = async (email) => {
    const [data] = await db.query("SELECT * FROM user WHERE email = ?", [email]);
    console.log(data[0]);
    return data;
}

export const get_score = async (email) => {
  const [data] = await db.query(`SELECT * FROM user WHERE email = ?`,
    [email]
  );
    console.log(data);
    return data;
};

export const update_score = async (email,score) => {
    await db.query(`
        UPDATE user
        SET score = ?
        WHERE email = ?` , [score, email]);
    console.log("Data has been updated");
}