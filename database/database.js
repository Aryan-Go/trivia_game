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

export const insert_data = async (
  email,
  username,
  password,
  score,
  questions_answered,
  correct,
  incorrect
) => {
  await db.query(
    `INSERT INTO user (username,email,password,score,questions_answered,correct,incorrect) VALUES (?,?,?,?,?,?,?)`,
    [username, email, password, score, questions_answered, correct, incorrect]
  );
  console.log("Data has been added");
};

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

export const update_score = async (email,score,questions_answered,correct,incorrect) => {
    await db.query(`
        UPDATE user
        SET score = ?
        WHERE email = ?` , [score, email]);
        await db.query(
          `
            UPDATE user
            SET questions_answered = ?
            WHERE email = ?`,
          [questions_answered, email]
        );
        await db.query(
          `
            UPDATE user
            SET correct = ?
            WHERE email = ?`,
          [correct, email]
        );
        await db.query(
          `
            UPDATE user
            SET incorrect = ?
            WHERE email = ?`,
          [incorrect, email]
        );
    console.log("Data has been updated");
}

export const get_leader_board = async () => {
    const [data] = await db.query(`SELECT * FROM user ORDER BY score DESC`);
    console.log("Returning the data in descending order");
    console.log(data);
    return data;
}