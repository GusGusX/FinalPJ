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

app.get("/orders", (req, res) => {
  const query = `
    SELECT 
      o.order_id,
      o.customer_name,
      o.phone,
      o.address,
      o.order_date,
      o.total_price,
      GROUP_CONCAT(
        CONCAT(
          oi.product_id, '|', 
          oi.product_name, '|', 
          oi.price, '|', 
          oi.quantity, '|',
          oi.subtotal
        ) SEPARATOR ';'
      ) AS items
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    GROUP BY o.order_id
    ORDER BY o.order_date DESC
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error("Error fetching orders:", err);
      return res.status(500).send("Database error");
    }

    // แปลง items จาก string เป็น array ของ object
    results.forEach((order) => {
      if (order.items) {
        order.items = order.items.split(";").map((item) => {
          const [product_id, product_name, price, quantity, subtotal] = item.split("|");
          return {
            product_id: parseInt(product_id),
            product_name,
            price: parseFloat(price),
            quantity: parseInt(quantity),
            subtotal: parseFloat(subtotal),
          };
        });
      } else {
        order.items = [];
      }
    });

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

app.post("/orders", async (req, res) => {
  const { customer_name, phone, address, items, total_price } = req.body;

  // ตรวจสอบข้อมูลที่ส่งมา
  if (!customer_name || !phone || !address || !items || items.length === 0) {
    return res.status(400).send("ข้อมูลไม่ครบถ้วน");
  }

  // ตรวจสอบ subtotal ในแต่ละรายการสินค้า
  for (const item of items) {
    if (item.subtotal === undefined || item.subtotal === null) {
      return res.status(400).send("subtotal ไม่ถูกต้อง");
    }
  }

  // เริ่ม transaction
  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).send("Transaction error");
    }

    try {
      // 1. บันทึกคำสั่งซื้อในตาราง orders
      const orderQuery = `
        INSERT INTO orders (customer_name, phone, address, total_price)
        VALUES (?, ?, ?, ?)
      `;
      const [orderResult] = await db.promise().query(orderQuery, [
        customer_name,
        phone,
        address,
        total_price,
      ]);
      const orderId = orderResult.insertId;

      // 2. บันทึกรายการสินค้าใน order_items
      for (const item of items) {
        await db.promise().query(
          "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
          [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
        );

        // 3. อัปเดตสต็อกสินค้า
        await db.promise().query(
          "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      // 4. Commit transaction
      db.commit((err) => {
        if (err) {
          console.error("Transaction commit error:", err);
          return res.status(500).send("Transaction commit error");
        }
        res.status(201).json({
          success: true,
          message: "คำสั่งซื้อสำเร็จ และอัปเดตสต็อกสินค้าแล้ว",
          orderId,
          total_price,
        });
      });
    } catch (error) {
      // หากเกิดข้อผิดพลาด Rollback transaction
      db.rollback(() => {
        console.error("Transaction rollback due to error:", error.message);
        res.status(500).send(error.message);
      });
    }
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