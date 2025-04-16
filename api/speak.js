// /api/speak.js

export default async function handler(req, res) {
  const apiKey = process.env.ELEVEN_API_KEY;
  const voiceId = "ThT5KcBeYPX3keUQqHPh"; // Dorothy

  const { text } = req.body;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": apiKey
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.8 }
    })
  });

  const audioBuffer = await response.arrayBuffer();

  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Content-Length", audioBuffer.byteLength);
  res.status(200).send(Buffer.from(audioBuffer));
}
