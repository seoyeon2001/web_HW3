const { Server } = require("socket.io");
const mysql = require("../mysql/index.js");
const jwt = require("jsonwebtoken");

const socketHandler = (server) => {
  const io = new Server(server);

  let users = {};
  let roomStates = {};

  io.on("connection", (socket) => {
    console.log('사용자가 연결되었습니다.');

    // 접속 시 서버에서 실행되는 코드
    const req = socket.request;
    const socket_id = socket.id;
    const client_ip = req.headers["x-forwarded-for"] || req.connection.remoteAddress;
    console.log("connection!");
    console.log("socket ID : ", socket_id);
    console.log("client IP : ", client_ip);
    
    // 사용자가 방에 입장
    socket.on('joinRoom', (data) => {
      const roomName = data.roomName;
      const userId = data.userId;

      users[socket.id] = { roomName, userId };
      
      // 해당 방에 입장
      socket.join(roomName);

      // 해당 방의 다른 사용자에게 새로운 사용자 알림
      socket.to(roomName).emit('userJoined', userId);

      socket.to(roomName).emit('welcome');

      console.log(`${userId}님이 ${roomName} 방에 입장하였습니다.`);

      // 방에 새로 들어온 사용자가 있으므로, 사용자 목록 업데이트 이벤트 발송
      updateAndBroadcastUserList(roomName);

      roomStates[roomName] = {
        currentValue: 1000,
      };
    });

    // 사용자가 방에서 퇴장
    socket.on('leaveRoom', () => {
      const userInfo = users[socket.id];  

      if (userInfo) {
        const { roomName, userId } = userInfo;

        // 해당 방에서 사용자 제거
        socket.leave(roomName);

        // 해당 방의 다른 사용자에게 사용자 퇴장 알림
        socket.to(roomName).emit('userLeft', { userId });

        console.log(`${userId}님이 ${roomName} 방에서 퇴장하였습니다.`);

        // 사용자 정보 삭제
        delete users[socket.id];

        // 방에서 나간 사용자가 있으므로, 사용자 목록 업데이트 이벤트 발송
        updateAndBroadcastUserList(roomName);
      }
    });

    socket.on('ready', () => {
      const userInfo = users[socket.id];

      if (userInfo) {
          const { roomName, userId } = userInfo;

          // 사용자의 '준비' 상태를 토글
          users[socket.id].ready = true;

          // 업데이트된 사용자 목록을 브로드캐스트
          updateAndBroadcastUserList(roomName);

          // 모든 사용자가 ready 버튼을 눌렀는지 확인
          const allUsersReady = Object.values(users)
              .filter((user) => user.roomName === roomName)
              .every((user) => user.ready);

          if (allUsersReady) {
              // 모든 사용자가 '준비' 상태이면 게임 시작
              io.to(roomName).emit('startGame');
          }
      }
    });

    socket.on('value', (value) => {
      const userInfo = users[socket.id];
      const { roomName, userId } = userInfo;

      roomStates[roomName].currentValue -= value;
      // 모든 클라이언트에게 업데이트된 값을 보냄
      io.to(roomName).emit('updateCurrentValue', roomStates[roomName].currentValue);

      if (roomStates[roomName].currentValue < 0) {
        console.log(`${userId}님이 게임에서 패배하였습니다.`);

        // 승리자
        socket.emit('finish', { result: 'win' });

        // 패배자
        const loser = Object.values(users)
        .filter(user => user.roomName === roomName && user.userId !== userId)
        .map(user => user.userId);

        for (let i = 0; i < loser.length; i++) {
          socket.broadcast.emit('finish', { result: 'lose' });
        }

        // 승리자의 승리 횟수를 1 증가
        mysql.query("updateWin", userId)

        // 패배자의 패배 횟수를 1 증가
        for (let i = 0; i < loser.length; i++) {
          mysql.query("updateLose", loser[i])
        }

        return;
      }
    })

    // 연결 해제 시
    socket.on('disconnect', () => {
      const userInfo = users[socket.id];

      if (userInfo) {
        const { roomName, userId } = userInfo;

        // 해당 방의 다른 사용자에게 사용자 퇴장 알림
        socket.to(roomName).emit('userLeft', userId);

        console.log(`${userId}님이 연결을 해제하였습니다.`);

        // 사용자 정보 삭제
        delete users[socket.id];

        // 방에서 나간 사용자가 있으므로, 사용자 목록 업데이트 이벤트 발송
        updateAndBroadcastUserList(roomName);
      }
    });

    socket.on('offer', (offer, roomName) => {
      socket.to(roomName).emit('offer', offer);
    });

    socket.on('answer', (answer, roomName) => {
      socket.to(roomName).emit('answer', answer);
    });

    socket.on('ice', (ice, roomName) => {
      socket.to(roomName).emit('ice', ice);
    });

  });

  function updateAndBroadcastUserList(roomName) {

    const userList = Object.values(users)
      .filter(user => user.roomName === roomName)
      .map(user => user.userId);

    io.to(roomName).emit('updateUserList', userList);

  }

};
module.exports = socketHandler;
