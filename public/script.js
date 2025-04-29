// script.js - GÜNCELLENMİŞ HALİ (İnternet Arama Butonu Eklendi)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton;
let gorselButton;
let searchButton; // *** YENİ BUTON İÇİN DEĞİŞKEN ***
let videoWrapper, introVideo, playButton;
let loadingMessageElement = null; // Yükleniyor mesajını takip etmek için

const BACKEND_URL = "https://sibelgpt-backend.onrender.com";

// --- Yükleniyor animasyonunu ekleme/kaldırma fonksiyonları ---
function showLoadingIndicator() {
    if (!chatBox) return;
    hideLoadingIndicator();

    loadingMessageElement = document.createElement("div");
    loadingMessageElement.classList.add("message", "bot-message", "loading-indicator");
    loadingMessageElement.innerHTML = `
        <span class="dots-container">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
        </span>
    `;
    chatBox.appendChild(loadingMessageElement);
    setTimeout(() => { chatBox.scrollTop = chatBox.scrollHeight; }, 50);
}

function hideLoadingIndicator() {
    if (loadingMessageElement) {
        loadingMessageElement.remove();
        loadingMessageElement = null;
    }
     const oldIndicators = chatBox?.querySelectorAll('.loading-indicator'); // chatBox null kontrolü
     oldIndicators?.forEach(el => el.remove()); // chatBox null kontrolü
}
// --- Yükleniyor fonksiyonları sonu ---

// ✅ Sadece görsel butonuna tıklandığında çağrılacak görsel üretim işlevi
async function handleGenerateImageClick() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen görsel için bir açıklama yazın.");
        return;
    }

    appendMessage("Sen", prompt, "user", true);
    showLoadingIndicator();
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

        hideLoadingIndicator();

        if (data.image_url) {
            const gorselHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <img src="<span class="math-inline">\{data\.image\_url\}" alt\="Üretilen Görsel" style\="max\-width\: 100%; max\-height\: 400px; object\-fit\: contain; border\-radius\: 8px; margin\-bottom\: 8px;" /\>
<button onclick\="indirGorsel\('</span>{data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #8e24aa; color: white; cursor: pointer;">
                    📥 İndir
                    </button>
                </div>
            `;
            appendMessage("SibelGPT", gorselHTML, "bot", true);
        } else {
            appendMessage("SibelGPT", "❗ Görsel üretilemedi: " + (data.error || 'Bilinmeyen bir sunucu hatası oluştu.'), "bot", true);
        }
    } catch (e) {
        hideLoadingIndicator();
        console.error("Görsel buton hatası:", e);
        appendMessage("SibelGPT", "⚠️ Görsel üretme servisine bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    }
}

// *** YENİ İNTERNET ARAMA BUTONU İŞLEVİ (ŞİMDİLİK BOŞ) ***
async function handleInternetSearchClick() {
    const prompt = userInput?.value?.trim(); // Girdiyi al (null kontrolü)
    console.log('İnternet Araması butonu tıklandı!');
    alert('İnternet arama özelliği yakında eklenecektir.');

    // TODO: Backend'e Serper API isteği gönderecek kod buraya gelecek.
    // Bu fonksiyon backend entegrasyonu yapıldığında güncellenecek.
    // Örnek adımlar:
    // if (!prompt) { alert("Lütfen arama için bir konu yazın."); return; }
    // appendMessage("Sen", `İnternette şunu ara: ${prompt}`, "user", true);
    // showLoadingIndicator();
    // userInput.value = "";
    // try {
    //      const res = await fetch(`${BACKEND_URL}/search`, { /* ... */ });
    //      const data = await res.json();
    //      hideLoadingIndicator();
    //      appendMessage("SibelGPT", data.searchResult || "Arama sonucu bulunamadı.", "bot", true);
    // } catch (e) {
    //      hideLoadingIndicator();
    //      appendMessage("SibelGPT", "⚠️ Arama sırasında bir hata oluştu.", "bot", true);
    // }
}
// *** YENİ İNTERNET ARAMA BUTONU İŞLEVİ SONU ***


// Ana mesaj gönderme fonksiyonu (Sohbet için)
async function sendMessage() {
  const message = userInput?.value?.trim(); // null kontrolü
  if (!message) return;

  appendMessage("Sen
