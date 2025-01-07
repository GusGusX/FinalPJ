const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()
app.use(express.json())
app.use(cors())

require('dotenv').config()

const PORT = '8888'

const LINE_BOT_API = 'https://api.line.me/v2/bot'
const LINE_CHANNEL_ACCESS_TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN

const headers = {
  'content-Type': 'application/json',
  'Authorization': `Bearer ${LINE_CHANNEL_ACCESS_TOKEN}`
}

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

    if (lineEvent.message.text === 'สมัครสมาชิก'){
      // updaterichmenu
      const response = await axios.post(
        `${LINE_BOT_API}/user/${userId}/richmenu/${richMenuId}`,
        {},
        { headers }
      )
      console.log('response', response.data)
       await sendMessage(userId, 'ยินดีด้วยสมัครชิกใหม่')
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

