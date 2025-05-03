import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// script.js - GÜNCELLENMİŞ HALİ (GPT Seçenekleri Eklendi)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton; 
let gorselButton; 
let videoWrapper, introVideo, playButton; 
let loadingMessageElement = null; // Yükleniyor mesajını takip etmek için
let currentGptMode = 'real-estate'; // Varsayılan mod

const BACKEND_URL = "https://sibelgpt-backend.onrender.com"; 

// GPT modu değiştirme fonksiyonu
function setGptMode(mode) {
    currentGptMode = mode;
    
    // Aktif buton stilini güncelle
    const buttons = document.querySelectorAll('.gpt-button');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // İlgili butonu aktif et
    let activeButton;
    switch(mode) {
        case 'real-estate':
            activeButton = document.getElementById('real-estate-gpt');
            break;
        case 'mind-coach':
            activeButton = document.getElementById('mind-coach-gpt');
            break;
        case 'finance':
            activeButton = document.getElementById('finance-gpt');
            break;
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Sohbeti temizle ve yeni moda göre başlat
    clearChat(mode);
}

// --- Yükleniyor animasyonunu ekleme/kaldırma fonksiyonları ---
function showLoadingIndicator() {
    if (!chatBox) return;
    // Önceki yükleniyor mesajı varsa kaldır
    hideLoadingIndicator(); 
    
    loadingMessageElement = document.createElement("div");
    loadingMessageElement.classList.add("message", "bot-message", "loading-indicator"); // Özel sınıf ekle
    loadingMessageElement.innerHTML = `
        <span class="dots-container">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </span>
    `;
    chatBox.appendChild(loadingMessageElement);
    // Scroll to bottom
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
}

function hideLoadingIndicator() {
    if (loadingMessageElement) {
        loadingMessageElement.remove();
        loadingMessageElement = null;
    }
     // Ekstra kontrol: Bazen eski mesajlar kalabilir, onları da temizleyelim
     const oldIndicators = chatBox.querySelectorAll('.loading-indicator');
     oldIndicators.forEach(el => el.remove());
}
// --- Yükleniyor fonksiyonları sonu ---

// ✅ Sadece görsel butonuna tıklandığında çağrılacak görsel üretim işlevi
async function handleGenerateImageClick() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen görsel için bir açıklama yazın."); 
        return; 
    }
    
    appendMessage("Sen", prompt, "user", true); // Önce kullanıcının promptunu ekle
    showLoadingIndicator(); // Yükleniyor animasyonunu göster
    userInput.value = ""; 
    if (sendArrowButton) {
        sendArrowButton.classList.remove('visible');
    }

    try {
        const res = await fetch(`${BACKEND_URL}/image`, { 
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await res.json();
        
        hideLoadingIndicator(); // Cevap gelince animasyonu kaldır

        if (data.image_url) {
            const gorselHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <img src="${data.image_url}" alt="Üretilen Görsel" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;" />
                    <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #8e24aa; color: white; cursor: pointer;">
                    📥 İndir
                    </button>
                </div>
            `;
            // Prompt zaten eklendi, sadece cevabı ekle
            appendMessage("SibelGPT", gorselHTML, "bot", true); 
        } else {
            appendMessage("SibelGPT", "❗ Görsel üretilemedi: " + (data.error || 'Bilinmeyen bir sunucu hatası oluştu.'), "bot", true);
        }
    } catch (e) {
        hideLoadingIndicator(); // Hata durumunda da animasyonu kaldır
        console.error("Görsel buton hatası:", e);
        appendMessage("SibelGPT", "⚠️ Görsel üretme servisine bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    }
}


// Ana mesaj gönderme fonksiyonu (Sohbet için)
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user", true); // Kullanıcı mesajını ekle
  showLoadingIndicator(); // Animasyonu göster
  userInput.value = ""; 
  if (sendArrowButton) { 
      sendArrowButton.classList.remove('visible');
  }

  try {
    // Seçili GPT modunu da gönder
    const response = await fetch(`${BACKEND_URL}/chat`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
          question: message,
          mode: currentGptMode // Seçilen modu gönder
