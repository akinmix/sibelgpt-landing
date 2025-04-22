async function sendMessage() {
  const input = document.getElementById("user-input");
  const message = input.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user");
  input.value = "";

  try {
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const data = await response.json();
    appendMessage("SibelGPT", data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.", "bot");
  } catch (error) {
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot");
    console.error(error);
  }
}

function appendMessage(sender, text, role) {
  const chatBox = document.getElementById("chat-box");
  const messageElem = document.createElement("div");
  messageElem.className = "message " + role;
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;
  chatBox.appendChild(messageElem);
  setTimeout(() => {
  chatBox.scrollTop = chatBox.scrollHeight;
}, 100);

}
