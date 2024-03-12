const express = require("express");
const router = express.Router();
const fs = require("fs");
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const mysql = require("../mysql/index.js");
const { verifyToken } = require("./middlewares");

/* GET room page. */
router.get("/:roomName", (req, res, next) => {
    console.log("roomName : ", req.params.roomName);
    fs.readFile("./views/room.html", (err, data) => {
      if (err) {
        res.send("error");
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.write(data);
        res.end();
      }
    });
  });

/* get user id */
router.get('/:roomName/get-user-id', verifyToken, (req, res) => {
  res.json({ userId: req.decoded.id });
});

module.exports = router;
