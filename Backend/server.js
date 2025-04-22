const express = require('express');
const axios = require('axios');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2');
const path = require('path');
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

app.get('/admin/statistics/revenue', async (req, res) => {
  const { start, end } = req.query;

  let dateCondition = '';
  const values = [];

  if (start && end) {
    dateCondition = `AND DATE(o.order_date) BETWEEN ? AND ?`;
    values.push(start, end);
  }

  const query = `
    SELECT oi.product_name, SUM(oi.price * oi.quantity) AS total_price
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE 1=1 ${dateCondition}
    GROUP BY oi.product_name
  `;

  db.query(query, values, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const labels = results.map(r => r.product_name);
    const values = results.map(r => r.total_price);
    const totalRevenue = values.reduce((acc, val) => acc + parseFloat(val), 0);

    res.json({ labels, values, totalRevenue });
  });
});

app.get('/admin/users', (req, res) => {
  db.query("SELECT line_user_id, display_name FROM users", (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });
    res.json(results);
  });
});

app.get('/admin/statistics/:userId', async (req, res) => {
  const userId = req.params.userId;
  const start = req.query.start;
  const end = req.query.end;

  let dateCondition = '';
  const params = [userId];

  // ✅ ถ้ามี start และ end → เพิ่มเงื่อนไขช่วงวันที่
  if (start && end) {
    dateCondition = 'AND DATE(o.order_date) BETWEEN ? AND ?';
    params.push(start, end);
  }

  const query = `
    SELECT oi.product_name, SUM(oi.quantity) AS total_quantity
    FROM orders o
    JOIN order_items oi ON o.order_id = oi.order_id
    WHERE o.user_id = ?
    ${dateCondition}
    GROUP BY oi.product_name
  `;

  db.query(query, params, (err, results) => {
    if (err) return res.status(500).json({ error: 'Database error' });

    const labels = results.map(r => r.product_name);
    const data = results.map(r => r.total_quantity);
    res.json({ labels, data });
  });
});

app.get('/userorders/statistics', async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accessToken = authHeader.split(' ')[1];

  try {
    // ✅ ตรวจสอบ Access Token กับ LINE API
    const response = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userId = response.data.userId;

    const query = `
      SELECT oi.product_name, SUM(oi.quantity) AS total_quantity
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.user_id = ?
      GROUP BY oi.product_name
    `;

    db.query(query, [userId], async (err, results) => {
      if (err) {
        console.error('❌ Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(200).json({ base64: null }); // ยังไม่มีข้อมูล
      }

      const labels = results.map((r) => r.product_name);
      const data = results.map((r) => r.total_quantity);

      const base64Chart = await generateChartBase64(labels, data);

      res.json({ base64: base64Chart });
    });
  } catch (error) {
    console.error('❌ Token verification or chart error:', error.message);
    return res.status(403).json({ error: 'Invalid token' });
  }
});


app.put("/orders/:id/payment", (req, res) => {
  const { id } = req.params;
  const { payment_status } = req.body;

  console.log(`📌 อัปเดต Payment Status: Order ID ${id} -> ${payment_status}`);

  const sql = "UPDATE orders SET payment_status = ? WHERE order_id = ?";
  
  db.query(sql, [payment_status, id], (error, results) => {
    if (error) {
      console.error("Error updating payment status:", error);
      return res.status(500).json({ error: "Failed to update payment status" });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: "Order not found" });
    }

    // ✅ ดึงข้อมูลอัปเดตกลับไปที่ Frontend
    db.query("SELECT * FROM orders WHERE order_id = ?", [id], (err, updatedOrder) => {
      if (err) {
        console.error("Error fetching updated order:", err);
        return res.status(500).json({ error: "Failed to fetch updated order" });
      }
      res.json({ success: true, message: " อัปเดตสถานะสำเร็จ", order: updatedOrder[0] });
    });
  });
});

app.put('/orders/:orderId/delivery', async (req, res) => {
  console.log("📝 Body ที่รับมา:", req.body);
  const { user_id, customer_name,delivery_status, delivery_eta } = req.body;
  const orderId = req.params.orderId;

  if (!user_id || !customer_name || !delivery_status || !delivery_eta ) {
    return res.status(400).json({ error: "ข้อมูลไม่ครบ" });
  }

  try {
    // อัปเดตสถานะใน DB
    await db.promise().query(
      'UPDATE orders SET delivery_status = ?, delivery_eta = ? WHERE order_id = ?',
      [delivery_status, delivery_eta, orderId]
    );

    // ส่งข้อความแจ้งเตือนผ่าน LINE
    const message = {
      to: user_id,
      messages: [
        {
          type: "text",
          text: `📦 คำสั่งซื้อของคุณ (หมายเลข: ${orderId})\n🚚 สถานะ: ${delivery_status}\n🕒 จะถึงภายใน: ${delivery_eta} นาที`,
        }
      ]
    };

    await axios.post('https://api.line.me/v2/bot/message/push', message, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      }
    });

    return res.json({ success: true, message: 'อัปเดตและส่งแจ้งเตือนสำเร็จแล้ว' });

  } catch (error) {
    console.error('อัปเดตหรือส่งแจ้งเตือนล้มเหลว:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});


app.get("/orders", (req, res) => {
  const query = `
  SELECT 
    o.order_id,
    o.payment_status,
    o.customer_name,
    o.phone,
    o.address,
    o.order_date,
    o.total_price,
    o.user_id,  
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

    // ✅ แปลง items จาก string เป็น array ของ object
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

app.get("/userorders", async (req, res) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized: No token provided" });
  }

  const accessToken = authHeader.split(" ")[1];

  try {
    // ✅ เรียก LINE API เพื่อตรวจสอบ token และดึง userId
    const response = await axios.get("https://api.line.me/v2/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userProfile = response.data;
    const userId = userProfile.userId;

    // ✅ Query คำสั่งซื้อเฉพาะของ user นี้
    const query = `
      SELECT 
        o.order_id,
        o.payment_status,
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
      WHERE o.user_id = ?
      GROUP BY o.order_id
      ORDER BY o.order_date DESC
    `;

    db.query(query, [userId], (err, results) => {
      if (err) {
        console.error("❌ Database error:", err);
        return res.status(500).send("Database error");
      }

      // ✅ แปลง string เป็น array ของสินค้า
      const formattedOrders = results.map((order) => ({
        ...order,
        items: order.items
          ? order.items.split(";").map((item) => {
              const [product_id, product_name, price, quantity, subtotal] = item.split("|");
              return {
                product_id: parseInt(product_id),
                product_name,
                price: parseFloat(price),
                quantity: parseInt(quantity),
                subtotal: parseFloat(subtotal),
              };
            })
          : [],
      }));

      res.json(formattedOrders);
    });
  } catch (error) {
    console.error("❌ Token verification failed:", error.response?.data || error.message);
    return res.status(403).json({ error: "Invalid or expired token" });
  }
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

function getDeliveryLabel(method) {
  return method === 'pickup'
    ? 'มารับเองที่ร้าน'
    : method === 'delivery'
    ? 'ให้ร้านจัดส่ง'
    : 'ไม่ระบุ';
}

app.post("/orders", async (req, res) => {
  const { user_id, customer_name, phone, address, items, total_price, delivery_method } = req.body;

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
        delivery_method,
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
        const message = `รายละเอียดออเดอร์ที่สั่ง
🧑 ชื่อลูกค้า: ${customer_name}
📞 เบอร์โทร: ${phone}
🏠 ที่อยู่: ${address}
📦 รหัสคำสั่งซื้อ: ${orderId}
🚚 วิธีรับสินค้า: ${getDeliveryLabel(delivery_method)}
💰 ยอดรวม: ฿${total_price}

🛍️ รายการสินค้า:
${items.map(item => `- ${item.product_name} x ${item.quantity} กิโลกรัม`).join('\n')}

🙏 ขอบคุณที่สั่งซื้อกับเรา`;
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
    const [rows] = await db.promise().query(
      `SELECT role FROM users WHERE line_user_id = ?`,
      [userId]
    );
    
    let role = "user"; 
    
    if (rows.length > 0) {
      role = rows[0].role; 
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

const createSimpleFlex  = (imageUrl, title, desc, link) => ({
  type: 'flex',
  altText: `📢 โปรโมชันใหม่: ${title}`,
  contents: {
    type: 'bubble',
    hero: {
      type: 'image',
      url: imageUrl,
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        { type: 'text', text: title, weight: 'bold', size: 'lg', wrap: true },
        { type: 'text', text: desc, size: 'sm', wrap: true }
      ]
    },
    footer: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'button',
          style: 'primary',
          color: '#f97316',
          action: {
            type: 'uri',
            label: '🛒 สั่งซื้อเลย',
            uri: link
          }
        }
      ]
    }
  }
});

const sendMessage = async (userId, message, flexMessage) => {
  try {
    const messages = [];

    // ✅ ข้อความธรรมดา
    if (message) {
      if (typeof message === 'string' && message.trim() !== '') {
        messages.push({
          type: 'text',
          text: message.trim()
        });
      }
    }

    // ✅ Flex Message ต้องมีโครงสร้างถูกต้อง
    if (flexMessage && flexMessage.type === 'flex' && flexMessage.contents) {
      messages.push(flexMessage);
    }

    if (messages.length === 0) {
      throw new Error('❌ ไม่มีข้อความที่จะส่ง');
    }

    const body = {
      to: userId,
      messages
    };

    const response = await axios.post(
      'https://api.line.me/v2/bot/message/push',
      body,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ ส่งข้อความเรียบร้อย:', response.data);
    return response;
  } catch (error) {
    console.error('❌ ส่งข้อความล้มเหลว:', error.response?.data || error.message);
    throw new Error(error);
  }
};

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

app.post('/upload-image', (req, res) => {
  if (!req.files || !req.files.image) {
    return res.status(400).json({ error: 'ไม่พบไฟล์ภาพ' });
  }

  const image = req.files.image;
  const uploadPath = path.join(__dirname, 'uploads', image.name);

  image.mv(uploadPath, (err) => {
    if (err) {
      console.error('❌ error:', err);
      return res.status(500).json({ error: 'อัปโหลดล้มเหลว' });
    }

    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/${image.name}`;
    res.json({ imageUrl });
  });
});

app.post('/send-promotion', async (req, res) => {
  const { targetUserId, productName, description, link, imageUrl } = req.body;

  // ตรวจสอบว่าได้ข้อมูลครบไหม
  if (!productName || !link || !imageUrl) {
    return res.status(400).json({ error: 'กรุณากรอกข้อมูลให้ครบถ้วน' });
  }

  // สร้าง Flex Message
  const flex = createSimpleFlex(imageUrl, productName, description, link);

  try {
    if (targetUserId === 'all') {
      // ✅ ส่งให้ผู้ใช้ทุกคน
      db.query('SELECT line_user_id FROM users', async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        const sendAll = results.map(user =>
          axios.post(
            'https://api.line.me/v2/bot/message/push',
            {
              to: user.line_user_id,
              messages: [flex]
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
                'Content-Type': 'application/json'
              }
            }
          )
        );

        await Promise.all(sendAll);
        res.json({ success: true, message: `✅ ส่งให้ทั้งหมด ${results.length} คน` });
      });
    } else {
      // ✅ ส่งให้เฉพาะผู้ใช้คนเดียว
      await axios.post(
        'https://api.line.me/v2/bot/message/push',
        {
          to: targetUserId,
          messages: [flex]
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
          }
        }
      );

      res.json({ success: true, message: '✅ ส่งโปรโมชันสำเร็จ' });
    }
  } catch (err) {
    console.error('❌ LINE API Error:', err.response?.data || err.message);
    res.status(500).json({ error: '❌ ส่งข้อความไม่สำเร็จ' });
  }
});

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