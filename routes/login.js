var express = require("express");
const mysql = require("../mysql/index.js");
const crypto = require('crypto');
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require("./middlewares");

var router = express.Router();

router.get('/', (req, res) => {
  fs.readFile("./views/login.html", (err, data) => {
    if (err) {
      console.log(err);
      res.send("error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    }
  });
});

  
router.post("/user", async (req, res) => {

  const id = req.body.id;
  const password = req.body.password;
  const rememberMe = req.body.rememberMe;

  const finduser = await mysql.query("finduser", [id]);

  // 아이디가 존재하지 않은 경우
  if(finduser.length === 0) {
    res.json({ type: 'no_id' });
  }else {
    // 아이디가 존재하는 경우
    const user = finduser[0];

    crypto.pbkdf2(password, user.salt, 100000, 64, 'sha512', async (err, key) => {
      check_password = key.toString('base64');

      if (user.password !== check_password) {
        // 비밀번호가 일치하지 않는 경우
        res.json({ type: 'wrong_pw' });
      } else {
        // 비밀번호가 일치하는 경우 - 이 때가 로그인 성공
        try {      
          const token = jwt.sign(
            { id: id, },
            process.env.JWT_SECRET,
            {
              expiresIn: "120m",
              issuer: "토큰 발급자",
            }
          );   

          return res.json({
            code: 200,
            message: "토큰이 발급되었습니다.",
            token, 
            type: 'right',
          });
        } catch (error) {
          console.error(error);
          return res.status(500).json({
            code: 500,
            message: "서버 에러",
          });
        }
      };

    });
  };
});

module.exports = router;