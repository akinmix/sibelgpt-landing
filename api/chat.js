async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  // Kullanıcı mesajını ekle
  const output = document.getElementById("chat-output");
  const userMsg = document.createElement("div");
  userMsg.className = "user";
  userMsg.innerText = message;
  output.appendChild(userMsg);

  // Giriş kutusunu temizle
  input.value = "";

  // Scroll'u en aşağıya kaydır
  output.scrollTop = output.scrollHeight;

  // Bot cevabı için bekleme mesajı
  const botMsg = document.createElement("div");
  botMsg.className = "bot";
  botMsg.innerText = "SibelGPT düşünüyor...";
  output.appendChild(botMsg);

  // API'ye mesaj gönder
  try {
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ question: message })
    });

    const data = await response.json();
    botMsg.innerText = data.reply || "Yanıt alınamadı.";
  } catch (error) {
    botMsg.innerText = "Bir hata oluştu. Lütfen tekrar deneyin.";
    console.error("Hata:", error);
  }

  // Scroll'u en aşağıya kaydır
  output.scrollTop = output.scrollHeight;
}
