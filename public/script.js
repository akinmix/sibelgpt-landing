// script.js - Basitleştirilmiş Versiyon

// Global değişkenler
const BACKEND_URL = "https://sibelgpt-backend.onrender.com";
let chatBox, userInput, sendArrowButton, splashScreen, mainInterface;

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
  console.log("DOM yüklendi");
  
  // Splash ekranı
  splashScreen = document.getElementById("splash-screen");
  mainInterface = document.getElementById("main-interface");
  
  if (splashScreen) {
    // Animasyon bittiğinde
    splashScreen.addEventListener('animationend', function(event) {
      if (event.target.classList.contains('splash-logo')) {
        console.log("Splash animasyonu bitti");
        splashScreen.style.display = "none";
        
        // Ana arayüzü göster
        if (mainInterface) {
          console.log("Ana arayüzü gösteriliyor");
          mainInterface.style.display = "flex";
        } else {
          console.error("Ana arayüz bulunamadı");
        }
      }
    });
  } else {
    // Splash yoksa ana arayüzü göster
    if (mainInterface) {
      mainInterface.style.display = "flex";
    }
  }
  
  // Temel arayüz elemanları
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  sendArrowButton = document.getElementById("send-arrow-button");
  
  // Mesaj gönderme işlevi
  if (sendArrowButton) {
    sendArrowButton.addEventListener('click', function() {
      const message = userInput.value.trim();
      if (message) {
        // Kullanıcı mesajını ekle
        appendMessage("Sen", message, "user");
        userInput.value = "";
        
        // SibelGPT'nin yanıtını ekle
        appendMessage("SibelGPT", "Merhaba! Ben SibelGPT. Şu anda basit modda çalışıyorum. Kısa sürede tam sürümüm aktif olacaktır.", "bot");
      }
    });
  }
  
  // Enter tuşu işlevi
  if (userInput) {
    userInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (sendArrowButton) {
          sendArrowButton.click();
        }
      }
    });
  }
  
  // Ekrana mesaj eklemek için işlev
  window.appendMessage = function(sender, text, role) {
    if (!chatBox) return;
    
    const messageElem = document.createElement("div");
    messageElem.classList.add("message");
    messageElem.classList.add(role + "-message");
    messageElem.innerHTML = `<strong>${sender}:</strong><br>${text}`;
    
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  // Başlangıç mesajı
  if (chatBox) {
    appendMessage("SibelGPT", "Merhaba! Ben SibelGPT. Size nasıl yardımcı olabilirim?", "bot");
  }
});
