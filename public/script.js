import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// SibelGPT - script.js - v8.0 (Aksiyon Menüsü Entegreli)

// --- Global Değişkenler ve Durum Yönetimi ---
const BACKEND_URL = "https://sibelgpt-backend.onrender.com"; 
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let supabase = null;
let currentConversation = [];
let currentGptMode = 'real-estate';
let currentAudio = null;
let playingButtonElement = null;

// DOM Elementleri
let chatBox, userInput, sendArrowButton, historyList, mainInterface;
let actionMenuToggle, actionMenu, webSearchButton, gorselButton;

// --- Ana Fonksiyonlar ---

// GPT Modunu Ayarlar
function setGptMode(mode) {
    currentGptMode = mode;
    document.body.className = `theme-${mode}`;
    
    // Aktif butonu güncelle
    document.querySelectorAll('.gpt-button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.getElementById(`${mode}-gpt`);
    if (activeButton) activeButton.classList.add('active');
    
    // Finans moduna özel butonları göster/gizle
    const financeButtons = ['stock-analysis-btn', 'technical-analysis-btn'];
    financeButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = (mode === 'finance') ? 'inline-block' : 'none';
    });

    // Finans banner'ını yönet
    if (window.tradingWidgetManager) {
        mode === 'finance' ? window.tradingWidgetManager.showFinanceBanner() : window.tradingWidgetManager.hideFinanceBanner();
    }
    
    clearChat(mode);
}
window.setGptMode = setGptMode; // Global erişim için

// Sohbet ve Web Araması için Mesaj Gönderme
async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("Sen", message, "user", true);
    showLoadingIndicator();
    userInput.value = "";
    sendArrowButton.classList.remove('visible');

    try {
        const historyToSend = currentConversation.map(msg => ({
            role: msg.role === 'bot' ? 'assistant' : msg.role,
            text: msg.text
        }));
        
        const response = await fetch(`${BACKEND_URL}/chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: message,
                mode: currentGptMode,
                conversation_history: historyToSend
            }),
        });

        hideLoadingIndicator();
        const data = await response.json();
        
        if (data.is_listing_response === true) {
            console.log("🏠 Backend'den ilan yanıtı sinyali geldi. Avatar gösteriliyor.");
            window.avatarSystem.show();
            // Avatar sistemi cevabı ne zaman göstereceğini kendi yönetebilir veya biz burada yönetebiliriz.
            // Şimdilik avatar gösterildikten hemen sonra cevabı yazdırıyoruz.
            setTimeout(() => {
                appendMessage("SibelGPT", data.reply || "İlanlar getirilirken bir sorun oluştu.", "bot", true);
                // İsteğe bağlı: avatarı cevap sonrası gizle
                // window.avatarSystem.hide(); 
            }, 500); // Küçük bir gecikme ile daha doğal bir his
        } else {
            appendMessage("SibelGPT", data.reply || "Bir hata oluştu.", "bot", true);
        }

    } catch (error) {
        handleApiError(error, "Mesaj gönderilirken hata oluştu.");
    }
}

async function performWebSearch() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen web'de aramak için bir soru yazın.");
        return;
    }

    appendMessage("Sen", `🌐 Web Araması: ${prompt}`, "user", true);
    showLoadingIndicator();
    userInput.value = "";
    sendArrowButton.classList.remove('visible');
    
    try {
        const response = await fetch(`${BACKEND_URL}/web-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: prompt, mode: currentGptMode }),
        });
        
        hideLoadingIndicator();
        const data = await response.json();
        appendMessage("SibelGPT", data.reply || "Web araması sonuç vermedi.", "bot", true);

    } catch (error) {
        handleApiError(error, "Web araması sırasında bir hata oluştu.");
    }
}

async function handleGenerateImageClick() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen oluşturulacak görseli tarif edin.");
        return;
    }
    
    appendMessage("Sen", `🎨 Görsel İsteği: ${prompt}`, "user", true);
    showLoadingIndicator();
    userInput.value = "";
    sendArrowButton.classList.remove('visible');

    try {
        const res = await fetch(`${BACKEND_URL}/image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });
        
        hideLoadingIndicator();
        const data = await res.json();
        
        if (data.image_url) {
            const imageHTML = `
                <div class="generated-image-container">
                    <img src="${data.image_url}" alt="Üretilen Görsel" class="generated-image" />
                    <a href="${data.image_url}" target="_blank" download="sibelgpt-image.png" class="download-button">📥 İndir</a>
                </div>`;
            appendMessage("SibelGPT", imageHTML, "bot", true);
        } else {
            appendMessage("SibelGPT", `❗ Görsel üretilemedi: ${data.error || 'Bilinmeyen hata.'}`, "bot", true);
        }
    } catch (error) {
        handleApiError(error, "Görsel üretme servisine bağlanılamadı.");
    }
}

// --- Yardımcı UI Fonksiyonları ---

function appendMessage(sender, text, role, addToHistory = false) {
    if (!chatBox) return;

    const messageElem = document.createElement("div");
    messageElem.classList.add("message", `${role}-message`);
    
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `<strong>${sender}:</strong><br>${text}`;
    messageElem.appendChild(contentDiv);

    if (role === 'bot') {
        const plainText = contentDiv.innerText.replace(`${sender}:`, '').trim();
        if (plainText.length > 10) { // Sadece anlamlı metinler için ses butonu ekle
            const voiceButton = document.createElement('button');
            voiceButton.className = 'voice-button';
            voiceButton.innerHTML = '<i class="fas fa-volume-up"></i>';
            voiceButton.title = 'Mesajı seslendir';
            voiceButton.onclick = () => playBotMessage(plainText, voiceButton);
            messageElem.appendChild(voiceButton);
        }
    }

    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;

    if (addToHistory) {
        currentConversation.push({ sender, text, role });
    }
}

function showLoadingIndicator() {
    hideLoadingIndicator(); // Öncekini temizle
    const loadingElem = document.createElement("div");
    loadingElem.id = "loading-indicator-message";
    loadingElem.classList.add("message", "bot-message");
    loadingElem.innerHTML = `<div class="dots-container"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
    chatBox.appendChild(loadingElem);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideLoadingIndicator() {
    const loadingElem = document.getElementById("loading-indicator-message");
    if (loadingElem) loadingElem.remove();
}

function handleApiError(error, defaultMessage) {
    console.error(defaultMessage, error);
    hideLoadingIndicator();
    window.avatarSystem.hide();
    appendMessage("SibelGPT", `❌ ${defaultMessage} Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.`, "bot", true);
}

// --- Sohbet Geçmişi Yönetimi ---

function saveCurrentConversation() {
    if (currentConversation.length <= 1) return;
    const conversations = loadConversations();
    const title = currentConversation.find(m => m.role === 'user')?.text.substring(0, 30) + '...' || "Yeni Sohbet";
    conversations.unshift({ id: Date.now(), title, mode: currentGptMode, messages: currentConversation });
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations.slice(0, 50)));
}

function loadConversations() {
    try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) {
        return [];
    }
}

function displayHistory() {
    // ... (Bu fonksiyonun içeriği değişmedi, eski kodunuzdaki gibi kalabilir veya bu sade versiyonu kullanabilirsiniz)
}

function clearChat(mode) {
    if (!chatBox) return;
    const welcomeMessages = {
        'real-estate': "Merhaba! Gayrimenkul GPT modundasınız. İdeal evinizi bulmanıza, yatırımlarınızı değerlendirmenize ve sektörle ilgili sorularınızı yanıtlamanıza yardımcı olabilirim.",
        'mind-coach': "Merhaba! Zihin Koçu modundasınız. Kişisel gelişim, motivasyon ve zihinsel sağlık konularında size rehberlik edebilirim. Hayatınıza nasıl bir dokunuş yapabiliriz?",
        'finance': "Merhaba! Finans GPT modundasınız. Yatırım stratejileri, bütçe yönetimi ve finansal hedeflerinize ulaşma konularında size yardımcı olabilirim."
    };
    const welcomeText = welcomeMessages[mode] || "Merhaba, size nasıl yardımcı olabilirim?";
    chatBox.innerHTML = '';
    appendMessage("SibelGPT", welcomeText, "bot", false);
    currentConversation = [{ sender: 'SibelGPT', text: welcomeText, role: 'bot' }];
}

// --- Başlatma ve Olay Dinleyicileri ---

document.addEventListener("DOMContentLoaded", () => {
    initializeSupabase();
    
    // Elementleri bir kez seç ve global değişkenlere ata
    chatBox = document.getElementById("chat-box");
    userInput = document.getElementById("user-input");
    sendArrowButton = document.getElementById("send-arrow-button");
    historyList = document.getElementById("history-list");
    mainInterface = document.getElementById("main-interface");
    actionMenuToggle = document.getElementById("action-menu-toggle");
    actionMenu = document.getElementById("action-menu");
    webSearchButton = document.getElementById("web-search-button");
    gorselButton = document.getElementById("gorsel-buton");
    
    // Splash ekranı yönetimi
    const splashScreen = document.getElementById("splash-screen");
    setTimeout(() => {
        splashScreen.style.opacity = 0;
        mainInterface.style.display = "flex";
        setTimeout(() => {
            splashScreen.style.display = "none";
            mainInterface.style.opacity = 1;
            userInput.focus();
        }, 500);
    }, 3500); // Splash ekranı süresi

    // Olay dinleyicilerini ata
    document.querySelector(".new-chat-button button").addEventListener("click", () => setGptMode(currentGptMode));
    userInput.addEventListener("keypress", (e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage()));
    userInput.addEventListener('input', () => sendArrowButton.classList.toggle('visible', userInput.value.trim() !== ''));
    sendArrowButton.addEventListener('click', sendMessage);

    // YENİ AKSİYON MENÜSÜ OLAYLARI
    actionMenuToggle.addEventListener('click', () => {
        actionMenu.classList.toggle('visible');
        actionMenuToggle.classList.toggle('active');
    });
    webSearchButton.addEventListener('click', () => {
        performWebSearch();
        actionMenu.classList.remove('visible');
        actionMenuToggle.classList.remove('active');
    });
    gorselButton.addEventListener('click', () => {
        handleGenerateImageClick();
        actionMenu.classList.remove('visible');
        actionMenuToggle.classList.remove('active');
    });
    // Menü dışına tıklanınca kapat
    document.addEventListener('click', (e) => {
        if (!actionMenu.contains(e.target) && !actionMenuToggle.contains(e.target)) {
            actionMenu.classList.remove('visible');
            actionMenuToggle.classList.remove('active');
        }
    });


    // GPT Mod Butonları
    document.getElementById('real-estate-gpt').addEventListener('click', () => setGptMode('real-estate'));
    document.getElementById('mind-coach-gpt').addEventListener('click', () => setGptMode('mind-coach'));
    document.getElementById('finance-gpt').addEventListener('click', () => setGptMode('finance'));
    // ... Diğer butonlar ve modal olayları ...

    // Başlangıç durumu
    setGptMode('real-estate');
});

async function initializeSupabase() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/config`);
        const config = await response.json();
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log("Supabase güvenli şekilde başlatıldı.");
        // Kullanıcı durumunu kontrol et ve UI'ı güncelle
        checkUserSession(); 
    } catch (error) {
        console.error("Supabase başlatma hatası:", error);
    }
}

function checkUserSession() {
    // ... Kullanıcı giriş/çıkış UI yönetimi kodları ...
}

// ... Ses çalma, hisse analizi modal'ı gibi diğer tüm yardımcı fonksiyonlarınız buraya eklenebilir ...
