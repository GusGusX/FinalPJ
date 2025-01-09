const express = require('express')
const axios = require('axios')
const cors = require('cors')
const mysql = require('mysql2');
require('dotenv').config()

const app = express()
app.use(express.json())
app.use(cors());

const PORT = '8888'

const LINE_BOT_API = 'https://api.line.me/v2/bot'
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

// MySQL Connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// ตรวจสอบการเชื่อมต่อ
db.connect((err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
  } else {
    console.log('Connected to the MySQL database');
  }
});

app.get("/order-history", (req, res) => {
  const query = 'SELECT * FROM orders';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
}); 


// linezone
const headers = {
  'content-Type': 'application/json',
  'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`,
}

// Function to send a message
const sendMessage = async (userId, message) => {
  try {

    const body = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    }
    const response = await axios.post(
      `${LINE_BOT_API}/message/push`,
      body,
      { headers }
    )
    return response
  } catch (error) {
    throw new Error(error)
  }
}

// Function to save user data to MySQL
const saveUserToDatabase = async (userId, displayName) => {
  try {
    const query = `
      INSERT INTO users (user_id, display_name)
      VALUES (?, ?)
      ON DUPLICATE KEY UPDATE
      display_name = VALUES(display_name)
    `
    await db.execute(query, [userId, displayName])
    console.log('User saved to database')
  } catch (error) {
    console.error('Database error:', error)
  }
}

app.post('/send-message', async (req, res) => {
  try {
    const { userId, message } = req.body

    const response = await sendMessage(userId, message)

    console.log('response', response.data)

    res.json({
      message: 'Send message success',
      responseData: response.data,
    })
  } catch (error) {
    console.log('error', error.response)
  }
})

app.post('/webhook', async (req, res) => {
  const { events } = req.body

  console.log(req.body)

  if (!events || events.length <= 0) {
    res.json({
      message: 'OK',
    })

    return false
  }

  console.log('events', events)

  try {
    const lineEvent = events[0]
    const userId = lineEvent.source.userId
    const displayName = lineEvent.source.displayName || 'ไม่ทราบชื่อ'
    const richMenuId = process.env.DEFAULT_MEMBER_RICH_MENU

    // Save user to database
    await saveUserToDatabase(userId, displayName)

    if (lineEvent.message.text === 'สมัครสมาชิก') {
      // Update rich menu
      const response = await axios.post(
        `${LINE_BOT_API}/user/${userId}/richmenu/${richMenuId}`,
        {},
        { headers }
      )
      console.log('response', response.data)
      await sendMessage(userId, 'ยินดีด้วยสมัครสมาชิกใหม่')
    }

    res.json({
      message: 'Send message success',
      
    })
  } catch (error) {
    console.log('error', error.response)
  }
})

app.listen(PORT, () => {
  console.log(`Express app listening at http://localhost:${PORT}`)
})

