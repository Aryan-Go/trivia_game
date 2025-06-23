import express from "express";
const app = express();

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import cookie_parser from "cookie-parser";
app.use(cookie_parser());

import axios from "axios";

import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT;
const api_key = process.env.api_key;
const url = process.env.url;
const secret = process.env.secret

import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

import { insert_data, get_data,get_score,update_score } from "./database/database.js";

app.get("/", (req, res) => {
    res.render("home.ejs");
})

app.get("/signup", (req, res) => {
    res.render("signup.ejs");
})

app.get("/login", (req, res) => {
  res.render("login.ejs");
});

app.post("/signup_add", async (req, res) => {
    try {
        const encrypted_password = await bcrypt.hash(req.body.password, 12);
        
        await insert_data(req.body.email, req.body.username, encrypted_password, 0);
        res.redirect("/login")
    } catch (error) {
        res.json({
            success: false,
            message: "There is some error in signing up right now",
        });
    }
})

app.post("/login_add", async (req, res) => {
    try {   
        const email = req.body.email;
        const password = req.body.password;
        const password_string = password.toString();
        // const token = req.cookies.token;
        // const payload = jwt.verify(token, secret);
        const data = await get_data(email);
        const password_check = data[0].password;
        const password_check_string = password_check.toString();
        // console.log(payload);
        const payload = {
          email: req.body.email,
          score: 0,
          password: password_check_string,
        };
        const token = await jwt.sign(payload, secret, {
          expiresIn: 2 * 60 * 60,
        });
        console.log(token);
        res.cookie("token", token);
        console.log(password);
        if (data[0].email == email) {
            if (
              await bcrypt.compareSync(password_string, password_check_string)
            ) {
              res.redirect("/");
            } else {
              res.json({
                success: false,
                message:
                  "The password is wrong please check once",
              });
            }
        }
        else {
            res.json({
                success: false,
                message: "Your email is incorrect or you are not signed in",
            })
        }
        
    } catch (error) {
        console.log(error);
        res.json({
            success: false,
            message: "The user is not signed up so please signup first",
        })
    }
});

app.get("/leader", (req, res) => {
    res.send("This is the leader page");
})

app.get("/question", async(req, res) => {
    try {
        // console.log(api_key);
        // axios.defaults.headers["X-Api-Key"] = api_key;
        const res2 = await axios.get(url, {
            headers: { "X-Api-Key": api_key }
        });
        // console.log("Response full:", res2);
        console.log("Status:", res2.status);
        console.log("Headers:", res2.headers);
        console.log("Data:", res2.data);
        const question = res2.data[0].question;
        const answer = res2.data[0].answer;
        console.log(question);
        console.log(answer);
        res.render("question.ejs", { question,answer });
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).send("Error fetching trivia");
    }
})
app.post("/ans_check", async (req, res) => {
    const req_ans = req.body.req_ans;
    const lower_req_ans = req_ans.toLowerCase();
    const given_ans = req.body.option;
    const lower_given_ans = given_ans.toLowerCase();
    if (lower_given_ans == lower_req_ans) {
        try {
            const token = req.cookies.token;
            const payload = jwt.verify(token, secret);
            const email = payload.email;
            const data = await get_score(email);
            const score = data[0].score;
            const new_score = score + 10;
            await update_score(email, new_score);
            console.log(new_score);
            res.send(req.body);
        }
        catch (err) {
            console.log(err);
            res.json({
                success: false,
                message: "Your JWT token has expired please login again"
            })
        }
    }
    else {
        res.send(req.body);
        console.log("This is not correct");
    }
})

app.listen(PORT, (err) => {
    if (err) {
        console.log(`There is some error = ${err}`);
    }
    else {
        console.log(`It is working on PORT = ${PORT}`);
    }
})
