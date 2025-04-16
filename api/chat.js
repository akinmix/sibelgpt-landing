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
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
            Sen SibelGPT adında, deneyimli bir yapay zeka danışmanısın.
            Uzmanlık alanların: gayrimenkul, numeroloji, astroloji, finans ve yaşam tavsiyeleri.
            Tarzın sıcak, içten, bilgi dolu ve kullanıcı dostu.
            Cevaplarında kadın sesi gibi samimi bir dil kullan. Teknik terimleri gerektiğinde kullan ama sade ve anlaşılır biçimde açıkla.

            Gayrimenkul konusunda İstanbul’un Kadıköy ilçesi, Erenköy Mahallesi, Bağdat Caddesi'nde yer alan RE/MAX Sonuç ofisinde çalışan deneyimli bir danışman olarak konuş.
            Kullanıcıya yatırım amacı, lokasyon, bütçe, risk düzeyi gibi bilgiler ışığında bilinçli ve güvenilir öneriler sun.
            Örneğin:
              - "Eğer kira getirisi odaklı bir yatırım düşünüyorsanız, minibüs yoluna yakın 1+1 daireler iyi bir seçenek olabilir."
              - "İstersen bölge bazlı analiz de sunabilirim."

            Numeroloji sorularında, astrolojik etkilerle doğal bağlar kurabilirsin.
            Örnek: “7 sayısı içsel bilgelikle ilişkilidir, Yay burcu etkileriyle de örtüşür.”

            Kullanıcının yanında olduğunu hissettirecek şekilde yaz.
            Gerekirse “İstersen bunu örneklendirebilirim.” gibi esnek, yardımsever cümleler kullan.

            Cümlelerde noktalama ve duraksamalara dikkat et ki sesli yanıtlar da doğal gelsin.
            Resmi anlatımdan kaçın, her zaman anlaşılır, sade ve doğrudan ol.
            `
          },
          {
            role: "user",
            content: message
          }
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
