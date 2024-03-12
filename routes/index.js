const express = require("express");
const router = express.Router();
const fs = require("fs");
const bodyParser = require('body-parser');
router.use(bodyParser.json());
const mysql = require("../mysql/index.js");
const { verifyToken } = require("./middlewares");

/* GET home page. */
router.get("/", function (req, res, next) {
  fs.readFile("./views/index.html", (err, data) => {
    if (err) {
      res.send("error");
    } else {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(data);
      res.end();
    }
  });
});

/* token check */
router.get("/checktoken", verifyToken, (req, res, next) => {
  res.json(req.decoded)
});

/* GET room list */
router.get('/showroomlist', async (req, res) => {
  try {
    const showrooms = await mysql.query("roomList");
    rooms = showrooms.map(showroom => showroom.roomname);
    res.json({ rooms });
  } catch (error) {
    console.error('방 리스트를 불러오는 과정에서 에러가 발생했습니다:', error);
    res.status(500).json({ error: 'Server Error' });
  };
});

/* Create room */
router.post('/create-room', async (req, res) => {
  const { roomName } = req.body; // 사용자가 입력한 방 이름

  try {
    const results = await mysql.query("createRoom", [roomName]);
    console.log('방을 만드는 데 성공했습니다.');
    res.json({ message: `방 [${roomName}]이 생성되었습니다.` });
  } catch (error) {
      console.error('에러:', error);
      res.status(500).json({ error: 'Server Error' });
  }
});

router.post('/join-room', async (req, res) => {
  try {
    const roomName = req.body.roomName; // 사용자가 입력한 roomName

    const findRoom = await mysql.query("findroom", roomName);

    if (findRoom.length === 0) {
      res.json({ message: '없는 방입니다.' });
    } else {
      res.json({ message: '방 입장 성공' });
    }
  } catch(err) {
    res.status(500).json({ error: '서버 오류' });
  }
});

module.exports = router;
