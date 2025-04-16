export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Yalnızca POST istekleri destekleniyor." });
  }

  let body = "";

  try {
    const buffers = [];
    for await (const chunk of req) {
      buffers.push(chunk);
    }
    body = Buffer.concat(buffers).toString();
  } catch (error) {
    console.error("Gövde okuma hatası:", error);
    return res.status(400).json({ error: "Gövde okunamadı." });
  }

  let parsed;
  try {
    parsed = JSON.parse(body);
  } catch (error) {
    console.error("JSON parse hatası:", error);
    return res.status(400).json({ error: "Geçersiz JSON" });
  }

  const text = parsed.text;
  const apiKey = process.env.ELEVEN_API_KEY;
  const voiceId = "ThT5KcBeYPX3keUQqHPh";

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": apiKey
      },
      body: JSON.stringify({
        text: text,
        model_id: "eleven_monolingual_v1",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.8
        }
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("ElevenLabs yanıt hatası:", error);
      return res.status(500).json({ error: "Ses üretilemedi", detail: error });
    }

    const audioBuffer = await response.arrayBuffer();
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Content-Length", audioBuffer.byteLength);
    res.status(200).send(Buffer.from(audioBuffer));

  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).json({ error: "Sunucu hatası", detail: error.message });
  }
}
