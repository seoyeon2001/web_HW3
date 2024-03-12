const mysql = require('mysql');
const sql = require('./sql');

require("dotenv").config({
    path: '.env'
});

// DB 연결
const pool = mysql.createPool(
    {
        host: process.env.MYSQL_HOST, // localhost
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        connectionLimit: process.env.MYSQL_LIMIT // 동시접속자 수
    }
);

// 쿼리 처리
const query = async (alias, values) => {
    return new Promise((resolve, reject) => 
        pool.query(sql[alias], values, (err, results) => {
            if (err) {
                console.log(err);
                reject({
                    err,
                });
            } else resolve(results);
        })
    );
};

module.exports = { query };