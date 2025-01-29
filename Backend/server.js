const express = require('express')
const axios = require('axios')
const cors = require('cors')
const jwt = require('jsonwebtoken');
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

//Api connect Frontend

app.get('/orders', (req, res) => {
  const query = 'SELECT * FROM orders'; // แก้ไข query ตามตารางของคุณ
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching orders:', err);
      res.status(500).send('Database error');
      return;
    }
    res.json(results);
  });
});


app.get("/products", (req, res) => {
  const query = 'SELECT * FROM products';
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.json(results);
    }
  });
});

app.post("/orders", (req, res) => {
  const { customer_name, phone, address, items } = req.body;

  if (!customer_name || !phone || !address || !items || items.length === 0) {
    return res.status(400).send("ข้อมูลไม่ครบถ้วน");
  }

  // บันทึกคำสั่งซื้อในตาราง orders
  const orderQuery = `INSERT INTO orders (customer_name, phone, address) VALUES (?, ?, ?)`;
  db.query(orderQuery, [customer_name, phone, address], (err, result) => {
    if (err) {
      console.error("Error inserting order:", err);
      return res.status(500).send("Error saving order");
    }

    const orderId = result.insertId;

    // บันทึกรายการสินค้าใน order_items
    const itemQueries = items.map((item) => {
      return new Promise((resolve, reject) => {
        const itemQuery = `INSERT INTO order_items (order_id, product_id, product_name, price, quantity) VALUES (?, ?, ?, ?, ?)`;
        db.query(
          itemQuery,
          [orderId, item.product_id, item.product_name, item.price, item.quantity],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    });

    // รอให้บันทึกสินค้าทั้งหมดเสร็จ
    Promise.all(itemQueries)
      .then(() => {
        res.status(201).send("คำสั่งซื้อสำเร็จ");
      })
      .catch((err) => {
        console.error("Error inserting order items:", err);
        res.status(500).send("Error saving order items");
      });
  });
});


// linezone

app.post('/verify-token', (req, res) => {
  const { idToken } = req.body;
  
  try {
    // ตรวจสอบ Signature และ Decode Token
    const decoded = jwt.verify(idToken, process.env.LINE_CHANNEL_SECRET, {
      algorithms: ['HS256'],
      audience: process.env.LINE_CHANNEL_ID,
      issuer: 'https://access.line.me',
    });

    console.log('Decoded Token:', decoded);
    res.status(200).json({ success: true, user: decoded });

  } catch (error) {
    console.error('JWT Verification Error:', error);
    res.status(400).json({ success: false, error: 'Invalid Token' });
  }
});
const headers = {
  'content-Type': 'application/json',
  'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
}

// Function to send a message
const sendMessage = async (userId, message) => {
  try {

    const body = {
      to: userId,
      messages: [
        {
          type: 'text',
          text: message
        }
      ]
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


app.post('/send-message', async (req, res) => {
  try {
    const { userId, message } = req.body

    const response = await sendMessage(userId, message)

    console.log('response', response.data)

    res.json({
      message: 'Send message success',
      responseData: response.data
    })
  } catch (error) {
    console.log('error', error.response)
  }
})

app.post("/webhook", async (req, res) => {
  const { events } = req.body;

  console.log(req.body)

  if (!events || events.length <= 0) {
    res.json({
      message: 'OK'
    })

    return false
  }

  console.log('events', events)

  try {
    const lineEvent = events[0]
    const userId = lineEvent.source.userId
    const richMenuId = process.env.DEFAULT_MEMBER_RICH_MENU

    if (lineEvent.message.text === 'สมัครสมาชิก') {
      // updaterichmenu
      const response = await axios.post(
        `${LINE_BOT_API}/user/${userId}/richmenu/${richMenuId}`,
        {},
        { headers }
      )
      console.log('response', response.data)
      await sendMessage(userId, 'ยินดีด้วยสมาชิกใหม่')
    }
    res.json({
      message: 'Send message success',
      responseData: response.data
    })
  } catch (error) {
    console.log('error', error.response)
  }
})



app.listen(PORT, (req, res) => {
  console.log(`Express app listening at http://localhost:${PORT}`);
})