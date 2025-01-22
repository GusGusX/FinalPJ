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
//Api connect Frontend
app.post("/orders", (req, res) => {
  const { cart, totalPrice } = req.body;

  // เพิ่มคำสั่งซื้อใหม่
  const insertOrderQuery = "INSERT INTO orders (total_price) VALUES (?)";
  db.query(insertOrderQuery, [totalPrice], (err, result) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error saving order", error: err });
    }

    const orderId = result.insertId;

    // เพิ่มสินค้าลงในคำสั่งซื้อ
    const orderDetailsQuery = `
      INSERT INTO order_details (order_id, product_id, quantity, price)
      VALUES ?`;
    const orderDetailsData = cart.map((item) => [orderId, item.id, item.quantity, item.price]);

    db.query(orderDetailsQuery, [orderDetailsData], (err) => {
      if (err) {
        return res.status(500).json({ success: false, message: "Error saving order details", error: err });
      }

      res.status(201).json({ success: true, orderId });
    });
  });
});

app.get("/orders", (req, res) => {
  const query = `
    SELECT o.id AS orderId, o.total_price, o.created_at,
           od.product_id, od.quantity, od.price, p.product_name
    FROM orders o
    JOIN order_details od ON o.id = od.order_id
    JOIN products p ON od.product_id = p.id
    ORDER BY o.created_at DESC`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ success: false, message: "Error fetching orders", error: err });
    }

    const orders = results.reduce((acc, row) => {
      const { orderId, total_price, created_at, product_id, quantity, price, product_name } = row;

      if (!acc[orderId]) {
        acc[orderId] = {
          orderId,
          total_price,
          created_at,
          items: [],
        };
      }

      acc[orderId].items.push({ product_id, product_name, quantity, price });
      return acc;
    }, {});

    res.json(Object.values(orders));
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

app.post("/checkout", (req, res) => {
  const { cart } = req.body; // รับข้อมูลตะกร้าสินค้าจาก Frontend
  if (!cart || cart.length === 0) {
    return res.status(400).send("Cart is empty.");
  }

  const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  // สร้างคำสั่งซื้อในตาราง `orders`
  const orderQuery = "INSERT INTO orders (total_price) VALUES (?)";
  db.query(orderQuery, [totalPrice], (err, result) => {
    if (err) {
      return res.status(500).send("Failed to create order.");
    }

    const orderId = result.insertId; // รหัสคำสั่งซื้อที่เพิ่งสร้าง

    // สร้างรายการในตาราง `order_details`
    const orderDetailsQuery = `
      INSERT INTO order_details (order_id, product_id, quantity, price)
      VALUES ?`;

    const orderDetails = cart.map(item => [
      orderId, // รหัสคำสั่งซื้อ
      item.id, // รหัสสินค้า
      item.quantity, // จำนวนสินค้า
      item.price // ราคาต่อหน่วย
    ]);

    db.query(orderDetailsQuery, [orderDetails], (err) => {
      if (err) {
        return res.status(500).send("Failed to create order details.");
      }
      res.status(201).send({ message: "Order placed successfully", orderId });
    });
  });
});

app.get("/order-history", (req, res) => {
  const query = `
    SELECT 
      o.order_id, 
      o.total_price, 
      o.created_at, 
      od.product_id, 
      od.quantity, 
      od.price, 
      p.product_name
    FROM orders o
    JOIN order_details od ON o.order_id = od.order_id
    JOIN products p ON od.product_id = p.product_id
    ORDER BY o.created_at DESC`;

  db.query(query, (err, results) => {
    if (err) {
      return res.status(500).send("Failed to fetch order history.");
    }
    res.json(results);
  });
});

// linezone

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