CREATE DATABASE trivia;
USE trivia;
CREATE TABLE user(
	user_id INT AUTO_INCREMENT PRIMARY KEY NOT NULL,
	username VARCHAR(100) NOT NULL,
	password VARCHAR(400) NOT NULL,
	email VARCHAR(200) NOT NULL,
    score INT,
    questions_answered INT,
    correct INT,
    incorrect INT
);
SELECT * FROM user;
DROP TABLE user;