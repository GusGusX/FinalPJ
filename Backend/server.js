const express = require('express');
const axios = require('axios');
const cors = require('cors');
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
app.put("/orders/:id/payment", (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  console.log(`📌 อัปเดต Payment Status: Order ID ${id} -> ${payment_status}`);
  
  db.query(
    "UPDATE orders SET payment_status = ? WHERE order_id = ?",
    [payment_status, id],
    (error, results) => {
      if (error) {
        console.error("❌ Error updating payment status:", error);
        return res.status(500).json({ error: "Failed to update payment status" });
      }
      res.json({ success: true, message: "✅ อัปเดตสถานะสำเร็จ" });
    }
  );
});

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
  db.query("SELECT * FROM products", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/products", (req, res) => {
  const { product_name, price, quantity, image_url } = req.body;
  db.query(
    "INSERT INTO products (product_name, price, quantity, image_url) VALUES (?, ?, ?, ?)",
    [product_name, price, quantity, image_url],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ product_id: result.insertId, product_name, price, quantity, image_url });
    }
  );
});

app.put("/products/:id", (req, res) => {
  const { product_name, price, quantity, image_url } = req.body;
  db.query(
    "UPDATE products SET product_name=?, price=?, quantity=?, image_url=? WHERE product_id=?",
    [product_name, price, quantity, image_url, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
    }
  );
});

app.delete("/products/:id", (req, res) => {
  db.query("DELETE FROM products WHERE product_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post("/orders", async (req, res) => {
  const { user_id, customer_name, phone, address, items, total_price } = req.body;

  if (!user_id || !customer_name || !phone || !address || !items || items.length === 0) {
    return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
  }

  for (const item of items) {
    if (item.subtotal === undefined || item.subtotal === null) {
      return res.status(400).json({ message: "subtotal ไม่ถูกต้อง" });
    }
  }

  db.beginTransaction(async (err) => {
    if (err) {
      console.error("Transaction error:", err);
      return res.status(500).json({ message: "Transaction error" });
    }

    try {
      const orderQuery = `
        INSERT INTO orders (user_id, customer_name, phone, address, total_price)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [orderResult] = await db.promise().query(orderQuery, [
        user_id,
        customer_name,
        phone,
        address,
        total_price,
      ]);

      const orderId = orderResult.insertId;
      console.log(`✅ คำสั่งซื้อถูกสร้างด้วย OrderID: ${orderId}`);

      // ✅ บันทึกรายการสินค้า
      for (const item of items) {
        await db.promise().query(
          "INSERT INTO order_items (order_id, product_id, product_name, price, quantity, subtotal) VALUES (?, ?, ?, ?, ?, ?)",
          [orderId, item.product_id, item.product_name, item.price, item.quantity, item.subtotal]
        );

        // ✅ อัปเดตจำนวนสินค้า
        await db.promise().query(
          "UPDATE products SET quantity = quantity - ? WHERE product_id = ?",
          [item.quantity, item.product_id]
        );
      }

      db.commit(async (err) => {
        if (err) {
          console.error("Transaction commit error:", err);
          return res.status(500).json({ message: "Transaction commit error" });
        }

        // ✅ สร้างข้อความสำหรับส่งผ่าน LINE
        const message = `🎉 สั่งซื้อสำเร็จแล้ว!
🧑 ชื่อลูกค้า: ${customer_name}
📞 เบอร์โทร: ${phone}
🏠 ที่อยู่: ${address}
📦 รหัสคำสั่งซื้อ: ${orderId}
💰 ยอดรวม: ฿${total_price}

🛍️ รายการสินค้า:
${items.map(item => `- ${item.product_name} x ${item.quantity} ชิ้น`).join('\n')}

🙏 ขอบคุณที่สั่งซื้อกับเรา!`;

        try {
          // ✅ ส่งข้อความผ่าน LINE (ตรวจสอบ Token ก่อน)
          if (!process.env.LINE_CHANNEL_ACCESS_TOKEN) {
            console.error("🚫 LINE_ACCESS_TOKEN ไม่ถูกต้องหรือไม่ได้ตั้งค่า");
            return res.status(500).json({ message: "LINE Access Token ไม่ถูกต้อง" });
          }

          await axios.post("https://api.line.me/v2/bot/message/push", {
            to: user_id,
            messages: [{ type: "text", text: message }],
          }, {
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            },
          });

          console.log("📤 ข้อความยืนยันถูกส่งไปยัง LINE แล้ว");

          res.status(201).json({
            success: true,
            message: "คำสั่งซื้อสำเร็จ และส่งข้อความยืนยันผ่าน LINE แล้ว",
            orderId,
            total_price,
          });

        } catch (lineError) {
          console.error("🚫 ไม่สามารถส่งข้อความผ่าน LINE ได้:", lineError.response?.data || lineError.message);

          // ✅ แม้การส่งข้อความล้มเหลว ก็ยังให้คำสั่งซื้อสำเร็จ
          res.status(201).json({
            success: true,
            message: "คำสั่งซื้อสำเร็จ แต่ไม่สามารถส่งข้อความผ่าน LINE ได้",
            orderId,
            total_price,
          });
        }
      });

    } catch (error) {
      db.rollback(() => {
        console.error("Transaction rollback due to error:", error.message);
        res.status(500).json({ message: error.message });
      });
    }
  });
});


// ✅ GET: ดึงคำสั่งซื้อเฉพาะผู้ใช้ตาม user_id
app.get("/orders", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ message: "กรุณาระบุ user_id" });
  }

  try {
    // ✅ ดึงคำสั่งซื้อเฉพาะ user_id ที่ระบุ
    const [orders] = await db.promise().query(
      "SELECT * FROM orders WHERE user_id = ? ORDER BY order_date DESC",
      [user_id]
    );

    // ✅ ดึงรายการสินค้าในแต่ละคำสั่งซื้อ
    for (let order of orders) {
      const [items] = await db.promise().query(
        "SELECT * FROM order_items WHERE order_id = ?",
        [order.id]
      );
      order.items = items;
    }

    res.status(200).json(orders);
  } catch (error) {
    console.error("❌ Error fetching orders:", error);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงคำสั่งซื้อ" });
  }
});


app.post('/update-profile', async (req, res) => {
  const { displayName, address, phone } = req.body;

  try {
    await db.promise().query(
      `UPDATE users SET address = ?, phone = ? WHERE display_name = ?`,
      [address, phone, displayName]
    );
    res.status(200).json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('DB Error:', error);
    res.status(500).json({ success: false, message: 'Database error' });
  }
});

app.get('/get-user/:userId', (req, res) => {
  const { userId } = req.params;

  const sql = 'SELECT * FROM users WHERE line_user_id = ?';

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error('❌ Database Error:', err);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(results[0]);
  });
});


// linezone

app.post('/verify-access-token', async (req, res) => {
  const { accessToken, userId, displayName, pictureUrl, statusMessage } = req.body;

  if (!accessToken) {
    return res.status(400).json({ success: false, error: 'Access Token is required' });
  }

  try {
    // ✅ 1. ตรวจสอบ Access Token กับ LINE API
    const { data } = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    console.log('✅ LINE API Verified:', data);

    // ✅ 2. ตรวจสอบว่าผู้ใช้เป็น Admin หรือไม่
    const [existingUser] = await db.promise().query(
      `SELECT role FROM users WHERE line_user_id = ?`,
      [userId]
    );

    let role = "user"; // 🔹 กำหนดค่าเริ่มต้นเป็น user

    if (existingUser.length > 0) {
      role = existingUser[0].role; // ถ้ามีข้อมูลใน DB → ใช้ Role เดิม
    } else {
      if (userId === "U80a4ed68809289ca53b0b888d31f5a91") { // 🔹 กำหนด Admin ด้วย User ID (แก้เป็น ID ของคุณ)
        role = "admin";
      }
    }

    // ✅ 3. บันทึกข้อมูล User + Role ลงฐานข้อมูล
    const [result] = await db.promise().query(
      `INSERT INTO users (line_user_id, display_name, picture_url, status_message, role)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE display_name = VALUES(display_name),
                               picture_url = VALUES(picture_url),
                               status_message = VALUES(status_message),
                               role = VALUES(role)`,
      [userId, displayName, pictureUrl, statusMessage, role]
    );

    console.log('✅ User profile & role saved to database');

    // ✅ 4. ส่งข้อมูล Role กลับไปให้ Frontend
    res.status(200).json({
      success: true,
      message: 'User saved successfully',
      role: role,
    });

  } catch (error) {
    console.error('❌ Error verifying or saving user:', error.response?.data || error.message);
    res.status(401).json({ success: false, error: 'Invalid Access Token or DB Error' });
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