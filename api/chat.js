document.addEventListener("DOMContentLoaded", () => {
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  sendButton.addEventListener("click", async () => {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("Sen", message, "user");
    userInput.value = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: message })
      });

      const data = await response.json();
      appendMessage("SibelGPT", data.reply || "Yanıt alınamadı.", "bot");
    } catch (error) {
      appendMessage("Hata", "Sunucuyla bağlantı kurulamadı.", "bot");
      console.error("Chat hatası:", error);
    }
  });

  function appendMessage(sender, text, type) {
    const msg = document.createElement("div");
    msg.className = `message ${type}`;
    msg.innerHTML = `<strong>${sender}:</strong> ${text}`;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});
