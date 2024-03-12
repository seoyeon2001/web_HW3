// 여기서는 쿼리문이 들어가

module.exports = {
    userList:`select * from users where id = ? and password = ?`,
    userID:`select id from users where id = ?`,
    userInsert: `INSERT INTO users set ?`,
    finduser: `select * from users where id = ?`,
    roomList: `select * from rooms`,
    createRoom: `INSERT INTO rooms (roomname) VALUES (?)`,
    findroom:`select roomname from rooms where roomname = ?`,
    updateWin: `UPDATE users SET wins = wins + 1 WHERE id = ?`,
    updateLose: `UPDATE users SET losses = losses + 1 WHERE id IN (?)`,
    getWinLoss: `select wins, losses from users where id = ?`,
    getallinfo: `select wins, losses from users`,
};