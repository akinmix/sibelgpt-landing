async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const message = input.value.trim();

  if (!message) return;

  // Kullanıcının mesajını göster
  const userMessage = document.createElement("div");
  userMessage.innerHTML = `<strong>Sen:</strong> ${message}`;
  chatBox.appendChild(userMessage);

  input.value = "";
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message })
    });

    const data = await response.json();

    const replyMessage = document.createElement("div");
    replyMessage.innerHTML = `<strong>SibelGPT:</strong> ${data.reply}`;
    chatBox.appendChild(replyMessage);
    chatBox.scrollTop = chatBox.scrollHeight;
  } catch (err) {
    const error = document.createElement("div");
    error.innerHTML = `<strong>Hata:</strong> Yanıt alınamadı.`;
    chatBox.appendChild(error);
  }
}
