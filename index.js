import express from "express";
const app = express();

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

import cron from "node-cron";
// const task = () => {
//     console.log("I am running every second");
// }
// cron.schedule("* * * * *", task);

import cookie_parser from "cookie-parser";
app.use(cookie_parser());

import axios from "axios";

import dotenv from "dotenv";
dotenv.config();
const PORT = process.env.PORT;
const api_key = process.env.api_key;
const url_link = process.env.url_link;
const secret = process.env.secret

import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");

import { insert_data, get_data,get_score,update_score,get_leader_board } from "./database/database.js";

const auth_checker = async (req, res, next) => {
    const token = req.cookies.token;
    if (token != null && token != undefined) {
        next();
    }
    else {
        res.json({
            success: false,
            message: "The person is not logged in or signed in please check once"
        });
    }
}

let res3;
let question_attempted = false;
cron.schedule("* * * * *",
    async () =>
                {
                    console.log("I am in the cron task");
                    const res = await axios.get(url_link, {
                        headers: { "X-Api-Key": api_key },
                    });
                    res3 = res;
                    console.log(res);
                    question_attempted = false;
                });

app.get("/", auth_checker ,(req, res) => {
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
        
        await insert_data(req.body.email, req.body.username, encrypted_password, 0,0,0,0);
        res.redirect("/login")
    } catch (error) {
        console.log(error);
        
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

app.get("/leader",auth_checker, async(req, res) => {
    const data = await get_leader_board();
    res.render("leaderborad.ejs" , {data});
})


app.get("/question",auth_checker, async(req, res) => {
    try {
        // console.log(api_key);
        // axios.defaults.headers["X-Api-Key"] = api_key;
        if (!question_attempted) {
            console.log("Response full:", res3);
            console.log("Status:", res3.status);
            console.log("Headers:", res3.headers);
            console.log("Data:", res3.data);
            const question = res3.data[0].question;
            const answer = res3.data[0].answer;
            console.log(question);
            console.log(answer);
            res.render("question.ejs", { question, answer });
            question_attempted = true;
        }
        else {
            res.json({
                success: false,
                message: "You have already attempted the question please wait for 6hrs for a new question"
            })
        }
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        res.status(500).json(
            {
                success: false,
                message: "Error fetching trivia"
            });
    }
})
app.post("/ans_check", async (req, res) => {
    const req_ans = req.body.req_ans;
    const lower_req_ans = req_ans.toLowerCase();
    const given_ans = req.body.option;
    const lower_given_ans = given_ans.toLowerCase();
    const question = req.body.question;
    if (lower_given_ans == lower_req_ans) {
        try {
            const token = req.cookies.token;
            const payload = jwt.verify(token, secret);
            const email = payload.email;
            const data = await get_score(email);
            const score = data[0].score;
            let question_answered = data[0].questions_answered;
            let correct = data[0].correct;
            let incorrect = data[0].incorrect;
            question_answered++;
            correct++;
            const new_score = score + 10;
            await update_score(email, new_score , question_answered,correct,incorrect);
            console.log(new_score);
            res.render("correct.ejs", { req_ans, given_ans, question });
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
        const token = req.cookies.token;
        const payload = jwt.verify(token, secret);
        const email = payload.email;
        const data = await get_score(email);
        const score = data[0].score;
        let question_answered = data[0].questions_answered;
        let incorrect = data[0].incorrect;
        let correct = data[0].correct;
        question_answered++;
        incorrect++;
        await update_score(email, score , question_answered,correct,incorrect);
        res.render("answer.ejs" , {req_ans,given_ans,question});
        console.log("This is not correct");
    }
})

app.get("/profile",auth_checker, async(req, res) => {
    const token = req.cookies.token;
    const payload = await jwt.verify(token, secret);
    const email = payload.email;
    const data = await get_data(email);
    const data2 = await get_leader_board();
    // const rank = 
    res.render("profile.ejs", { data });
})

app.listen(PORT, (err) => {
    if (err) {
        console.log(`There is some error = ${err}`);
    }
    else {
        console.log(`It is working on PORT = ${PORT}`);
    }
})
