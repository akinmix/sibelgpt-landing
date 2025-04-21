async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");
  const userMessage = input.value.trim();

  if (!userMessage) return;

  // Kullanıcı mesajı göster
  const userDiv = document.createElement("div");
  userDiv.className = "message user-message";
  userDiv.innerHTML = `<strong>Sen:</strong> ${userMessage}`;
  chatBox.appendChild(userDiv);

  input.value = "";

  // Cevap bekleniyor
  const botDiv = document.createElement("div");
  botDiv.className = "message bot-message";
  botDiv.innerHTML = `<strong>SibelGPT:</strong> yazıyor...`;
  chatBox.appendChild(botDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await response.json();
    botDiv.innerHTML = `<strong>SibelGPT:</strong> ${data.reply}`;
  } catch (error) {
    botDiv.innerHTML = `<strong>SibelGPT:</strong> Bir hata oluştu.`;
  }

  chatBox.scrollTop = chatBox.scrollHeight;
}
