export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Yalnızca POST istekleri destekleniyor." });
  }

  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Mesaj eksik." });
  }

  const apiKey = process.env.OPENAI_API_KEY;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // ✅ en yeni model buraya yazıldı
        messages: [
          { role: "system", content: "Sen SibelGPT adında, gayrimenkul, numeroloji, finans ve yaşam tavsiyeleri sunan yardımcı bir asistansın. Sorulara kısa, net, sıcak bir dille cevap ver." },
          { role: "user", content: message }
        ],
        temperature: 0.7
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Hatası:", data);
      return res.status(500).json({ error: "Cevap alınamadı", detail: data });
    }

    return res.status(200).json({ reply: data.choices[0].message.content });
  } catch (error) {
    console.error("Sunucu hatası:", error);
    return res.status(500).json({ error: "Sunucu hatası", detail: error.message });
  }
}
