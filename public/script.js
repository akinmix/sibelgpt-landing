// Basitleştirilmiş ve test edilmiş versiyon
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let chatBox, userInput;

window.addEventListener("load", () => {
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");

  const splashScreen = document.getElementById("splash-screen");
  const mainInterface = document.getElementById("main-interface");

  splashScreen.addEventListener('animationend', () => {
    splashScreen.style.opacity = 0;
    setTimeout(() => {
      splashScreen.style.display = "none";
      mainInterface.style.display = "flex";
    }, 300);
  });

  userInput.addEventListener("keypress", (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user");
  userInput.value = "";

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

      appendMessage("SibelGPT", botResponse, "bot");
    } catch (error) {
      console.error("Firecrawl hata:", error);
      appendMessage("SibelGPT", "❌ İlan detayları alınamadı. Lütfen tekrar deneyin.", "bot");
    }
    return;
  }

  // Normal mesaj
  try {
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot");
  } catch (error) {
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot");
    console.error("Mesaj gönderirken hata:", error);
  }
}

function appendMessage(sender, text, role) {
  const messageElem = document.createElement("div");
  messageElem.className = "message " + role;
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageElem);

  setTimeout(() => {
    chatBox.scrollTop = chatBox.scrollHeight;
  }, 100);
}
