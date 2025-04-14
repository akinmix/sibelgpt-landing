export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST method is allowed' });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: message }],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (response.ok) {
      res.status(200).json({ reply: data.choices?.[0]?.message?.content || "Yanıt alınamadı." });
    } else {
      res.status(500).json({ error: data.error.message || "Bilinmeyen bir hata oluştu." });
    }

  } catch (error) {
    res.status(500).json({ error: "Sunucu hatası: " + error.message });
  }
}
