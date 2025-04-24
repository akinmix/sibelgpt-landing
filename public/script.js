// ✅ Görsel üretim kontrolü ve işleyici (İNDİR BUTONLU)
async function istekGorselIseYonet(input) {
  const lower = input.toLowerCase();
  const anahtarKelimeler = [
    "çiz", "çizer misin", "çizimini yap", "bir şey çiz", "bir görsel oluştur",
    "görsel", "görselini yap", "görsel üret", "görselini üret",
    "resim", "resmini yap", "resim üret", "resim çiz", "resmini çizer misin",
    "foto", "fotoğraf", "fotoğrafını yap", "fotoğraf üret", "bir görüntü oluştur",
    "bir sahne yap", "görsel yap", "çiz bana", "şunu çiz", "şunun resmini yap", "şunun görselini oluştur"
  ];

  const istekGorselMi = anahtarKelimeler.some(kelime => lower.includes(kelime));
  if (!istekGorselMi) return null;

  try {
    const res = await fetch("https://sibelgpt-backend.onrender.com/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: input })
    });

    const data = await res.json();

    if (data.image_url) {
      return `
        <div style="display: flex; flex-direction: column; align-items: flex-start;">
          <img src="${data.image_url}" alt="Üretilen Görsel" style="max-width: 100%; border-radius: 8px; margin-bottom: 8px;" />
          <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #6a5acd; color: white; cursor: pointer;">
            📥 İndir
          </button>
        </div>
      `;
    } else {
      return "❗ Görsel üretilemedi, lütfen tekrar deneyin.";
    }

  } catch (e) {
    console.error("Görsel üretim hatası:", e);
    return "⚠️ Görsel üretim sırasında bir hata oluştu.";
  }
}
