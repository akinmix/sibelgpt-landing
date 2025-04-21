async function sendMessage() {
  const input = document.getElementById("user-input");
  const chatBox = document.getElementById("chat-box");

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Kullanıcı mesajını göster
  const userDiv = document.createElement("div");
  userDiv.className = "message user-message";
  userDiv.innerHTML = `<strong>Sen:</strong> ${userMessage}`;
  chatBox.appendChild(userDiv);

  input.value = "";

  // Sunucuya mesajı gönder
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: userMessage })
  });

  const data = await response.json();

  // Cevabı göster
  const botDiv = document.createElement("div");
  botDiv.className = "message bot-message";
  botDiv.innerHTML = `<strong>SibelGPT:</strong> ${data.reply}`;
  chatBox.appendChild(botDiv);

  // En sona kaydır
  chatBox.scrollTop = chatBox.scrollHeight;
}
