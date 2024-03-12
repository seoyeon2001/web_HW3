var express = require("express");
const mysql = require("../mysql/index.js");
const crypto = require('crypto');
const fs = require("fs");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { verifyToken } = require("./middlewares");

var router = express.Router();

router.get('/', (req, res) => {
  fs.readFile("./views/record.html", (err, data) => {
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

router.get('/info', verifyToken, async (req, res) => {
    const id = req.decoded.id;
    try {
      const getinfo = await mysql.query("getWinLoss", [id]);
      
      res.json({ wins: getinfo[0].wins, losses: getinfo[0].losses });
     
    } catch (error) {
      console.error('승패 정보를 가지고오면서 에러가 발생했습니다:', error);
      res.status(500).json({ error: 'Server Error' });
    };
  });

  router.get('/allinfo/:partnerID', async (req, res) => {
    const partnerID = req.params.partnerID;
    try {
      const getallinfo = await mysql.query("getWinLoss", [partnerID]);
      console.log('sdfhdlskfjdsfklahsdfl');
      console.log(getallinfo);
      res.json({ wins: getallinfo[0].wins, losses: getallinfo[0].losses });
     
    } catch (error) {
      console.error('승패 정보를 가지고오면서 에러가 발생했습니다:', error);
      res.status(500).json({ error: 'Server Error' });
    };
  });

router.get('/win', (req, res) => {
  fs.readFile("./views/win.html", (err, data) => {
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

router.get('/lose', (req, res) => {
  fs.readFile("./views/lose.html", (err, data) => {
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


module.exports = router;