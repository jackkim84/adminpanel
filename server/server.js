const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // 👈 토큰 생성을 위해 추가

const app = express();
app.use(cors()); // CORS 허용

// 💡 [중요] 리액트가 보낸 JSON 형식의 Body 데이터를 읽기 위해 반드시 추가해야 합니다.
app.use(express.json()); 

// 로컬 MySQL 연결 설정
const db = mysql.createConnection({
  host: 'localhost',      
  user: 'root',           
  password: '',   // 비밀번호 없음
  database: 'test' // test 데이터베이스
});

db.connect((err) => {
  if (err) throw err;
  console.log('MySQL 연결 성공!');
});



app.post('/api/login', (req, res) => {
  const { userId, password } = req.body; 

  const sql = 'SELECT * FROM users WHERE userId = ?';
  
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: '데이터베이스 에러' });
    }


    if (results.length === 0) {
      return res.status(401).json({ message: '존재하지 않는 아이디입니다.' });
    }

    const user = results[0]; 


    if (user.password !== password) {
      return res.status(401).json({ message: '비밀번호가 일치하지 않습니다.' });
    }


    const JWT_SECRET = 'my_secret_key_1234'; 
    const token = jwt.sign(
      { id: user.id, userId: user.user_id }, 
      JWT_SECRET, 
      { expiresIn: '2h' } 
    );

  
    return res.json({
      message: '로그인 성공',
      token: token
    });
  });
});


app.listen(3001, () => {
  console.log('서버가 3001번 포트에서 실행 중입니다.');
});