// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;

// ✅ Görsel üretim kontrolü ve işleyici
async function istekGorselIseYonet(input) {
  const lower = input.toLowerCase();
  const anahtarKelimeler = [
    "çiz", "görsel", "resim", "fotoğraf", "bir şey çiz", "görsel üret", "resmini yap", 
    "çizimini yap", "şunun görselini", "şunu çiz", "görselini oluştur"
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

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user", true);
  userInput.value = "";

  const gorselHTML = await istekGorselIseYonet(message);
  if (gorselHTML !== null) {
    appendMessage("SibelGPT", gorselHTML, "bot", true);
    return;
  }

  // ✅ FIRECRAWL İLAN SORGUSU
  if (message.startsWith("P") && message.length === 9) {
    try {
      const response = await fetch("https://sibelgpt-backend.onrender.com/api/ilan-detay", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ilan_no: message })
      });

      const data = await response.json();
      const veri = data.veri;

      let botResponse = `🏡 <b>${data.ilan_no}</b><br>`;
      if (veri.fiyat) botResponse += `💸 <b>Fiyat:</b> ${veri.fiyat}<br>`;
      if (veri.oda) botResponse += `🛏️ <b>Oda:</b> ${veri.oda}<br>`;
      if (veri.m2) botResponse += `📐 <b>Metrekare:</b> ${veri.m2} m²<br><br>`;
      if (veri.aciklama) botResponse += `📝 <b>Açıklama:</b><br>${veri.aciklama}<br><br>`;

      if (veri.fotograflar && veri.fotograflar.length > 0) {
        veri.fotograflar.forEach(foto => {
          botResponse += `<img src="${foto}" alt="İlan Fotoğrafı" style="max-width:100%; margin-top:10px;"><br>`;
        });
      }

      appendMessage("SibelGPT", botResponse, "bot", true);
    } catch (error) {
      console.error("Firecrawl hata:", error);
      appendMessage("SibelGPT", "❌ İlan detayları alınamadı. Lütfen tekrar deneyin.", "bot", true);
    }
    return;
  }

  try {
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot", true);
  } catch (error) {
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot", true);
    console.error("Mesaj gönderirken hata:", error);
  }
}

function appendMessage(sender, text, role, addToHistory = false) {
  const messageElem = document.createElement("div");
  messageElem.className = "message " + role;
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageElem);

  if (addToHistory) {
    currentConversation.push({ sender, text, role });
  }

  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 100);
}

function indirGorsel(url) {
  const link = document.createElement('a');
  link.href = url;
  link.download = 'sibelgpt-image.jpg';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function handleInputKeyPress(event) {
  if (event.key === 'Enter') {
    event.preventDefault();
    sendMessage();
  }
}

// Geri kalan kısımlar (geçmiş, splash ekranı, vs) aynen korunmuş

// Aşağıdaki kodlar değişmeden kalsın çünkü senin splash ve yükleme sistemiyle tam uyumlu:

// [.. buraya kadar olanlar aynı kalacak, sadece sendMessage fonksiyonu ve üstü değişti ..]
