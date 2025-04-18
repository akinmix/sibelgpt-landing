export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { message } = req.body;

    try {
      const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: message }),
      });

      const data = await response.json();
      res.status(200).json({ reply: data.reply });

    } catch (error) {
      res.status(500).json({ reply: "Sunucu hatası: " + error.message });
    }
  } else {
    res.status(405).end(); // Yalnızca POST destekleniyor
  }
}
