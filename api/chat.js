export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Sadece POST istekleri destekleniyor." });
  }

  try {
    const { question } = req.body;

    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question })
    });

    const data = await response.json();

    if (!data || !data.reply) {
      return res.status(500).json({ reply: "⚠️ Bot şu anda yanıt veremiyor." });
    }

    return res.status(200).json({ reply: data.reply });

  } catch (error) {
    console.error("❌ Hata:", error);
    return res.status(500).json({ reply: "❌ Bir hata oluştu. Sunucuya ulaşılamıyor." });
  }
}
