import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// SibelGPT - script.js - v9.5 (Tüm Fonksiyonlar Entegreli ve Stabil)

// --- 1. Global Değişkenler ---
const BACKEND_URL = "https://sibelgpt-backend.onrender.com";
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let supabase = null;
let currentConversation = [];
let currentGptMode = 'real-estate';
let currentAudio = null;
let playingButtonElement = null;
let currentModalMode = 'stock';

// --- DOM Elementleri (Globalde tanımlanacak) ---
let chatBox, userInput, sendArrowButton, historyList, mainInterface, newChatButton, helpButton;
let actionMenuToggle, actionMenu, webSearchButton, gorselButton;
let loginButton, loginModal, loginModalClose, googleLoginButton, emailInput, emailLoginButton;
let userInfo, userEmail, logoutButton, loginContainer;
let stockModal, stockModalClose, stockModalCancel, stockModalConfirm, stockSymbolInput;
let videoWrapper, introVideo, playButton;
let loadingMessageElement = null;

// ==========================================================================
// 2. ANA UYGULAMA MANTIĞI (Sohbet, Arama, Görsel)
// ==========================================================================

async function sendMessage() {
    const message = userInput.value.trim();
    if (!message) return;

    appendMessage("Sen", message, "user", true);
    showLoadingIndicator();
    userInput.value = "";
    if (sendArrowButton) sendArrowButton.classList.remove('visible');

    try {
        const historyToSend = currentConversation.slice(0, -1).map(msg => ({
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
        if (!response.ok) throw new Error(`HTTP Hata: ${response.status} - ${await response.text()}`);
        const data = await response.json();
        
        if (data.is_listing_response === true) {
            console.log("🏠 Backend'den ilan yanıtı sinyali geldi. Avatar gösteriliyor.");
            window.avatarSystem.show();
            setTimeout(() => {
                appendMessage("SibelGPT", data.reply || "İlanlar getirilirken bir sorun oluştu.", "bot", true);
            }, 500); 
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
    if (sendArrowButton) sendArrowButton.classList.remove('visible');
    
    try {
        const response = await fetch(`${BACKEND_URL}/web-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question: prompt, mode: currentGptMode }),
        });
        hideLoadingIndicator();
        if (!response.ok) throw new Error(`HTTP Hata: ${response.status}`);
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
    if (sendArrowButton) sendArrowButton.classList.remove('visible');

    try {
        const res = await fetch(`${BACKEND_URL}/image`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });
        hideLoadingIndicator();
        if (!res.ok) throw new Error(`HTTP Hata: ${res.status}`);
        const data = await res.json();
        
        if (data.image_url) {
            const imageHTML = `<div class="generated-image-container"><img src="${data.image_url}" alt="Üretilen Görsel" style="max-width:100%; border-radius:8px; margin-bottom:8px;" /><a href="${data.image_url}" target="_blank" download="sibelgpt-image.png" class="download-button" style="padding:6px 12px; background:var(--theme-primary); color:white; text-decoration:none; border-radius:4px;">📥 İndir</a></div>`;
            appendMessage("SibelGPT", imageHTML, "bot", true);
        } else {
            appendMessage("SibelGPT", `❗ Görsel üretilemedi: ${data.error || 'Bilinmeyen hata.'}`, "bot", true);
        }
    } catch (error) {
        handleApiError(error, "Görsel üretme servisine bağlanılamadı.");
    }
}

// ==========================================================================
// 3. AUTH (KULLANICI GİRİŞ) FONKSİYONLARI
// ==========================================================================

function setupAuthEventListeners() {
    loginButton?.addEventListener('click', () => loginModal.classList.add('visible'));
    loginModalClose?.addEventListener('click', () => loginModal.classList.remove('visible'));
    googleLoginButton?.addEventListener('click', signInWithGoogle);
    emailLoginButton?.addEventListener('click', signInWithEmail);
    logoutButton?.addEventListener('click', signOut);
    loginModal?.addEventListener('click', (e) => {
        if (e.target === loginModal) {
            loginModal.classList.remove('visible');
        }
    });
}

function updateUserUI(user) {
    if (user) {
        if(userInfo) userInfo.style.display = 'flex';
        if(loginContainer) loginContainer.style.display = 'none';
        if(userEmail) userEmail.textContent = user.email.split('@')[0];
    } else {
        if(userInfo) userInfo.style.display = 'none';
        if(loginContainer) loginContainer.style.display = 'flex';
    }
}

async function signInWithGoogle() {
    if (!supabase) return alert('Sistem hazır değil, lütfen birkaç saniye sonra tekrar deneyin.');
    const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.href } });
    if (error) alert(`Google ile girişte hata: ${error.message}`);
}

async function signInWithEmail() {
    if (!supabase) return alert('Sistem hazır değil.');
    const email = emailInput.value.trim();
    if (!email || !email.includes('@')) {
        alert('Lütfen geçerli bir e-posta adresi girin.');
        return;
    }
    const { error } = await supabase.auth.signInWithOtp({ email });
    if (error) {
        alert(`Hata: ${error.message}`);
    } else {
        alert('Giriş linki e-posta adresinize gönderildi. Lütfen gelen kutunuzu kontrol edin.');
        if(loginModal) loginModal.classList.remove('visible');
    }
}

async function signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
}


// ==========================================================================
// 4. UI ve YARDIMCI FONKSİYONLAR
// ==========================================================================

function setGptMode(mode) {
    currentGptMode = mode;
    document.body.className = `theme-${mode}`;
    document.querySelectorAll('.gpt-button').forEach(btn => btn.classList.remove('active'));
    const activeButton = document.getElementById(`${mode}-gpt`);
    if (activeButton) activeButton.classList.add('active');
    
    const financeButtons = ['stock-analysis-btn', 'technical-analysis-btn'];
    financeButtons.forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.style.display = (mode === 'finance') ? 'inline-block' : 'none';
    });
    
    if (window.tradingWidgetManager) {
        mode === 'finance' ? window.tradingWidgetManager.showFinanceBanner() : window.tradingWidgetManager.hideFinanceBanner();
    }
    clearChat(mode);
}
window.setGptMode = setGptMode;

function appendMessage(sender, text, role, addToHistory = false) {
    if (!chatBox) return;
    const messageElem = document.createElement("div");
    messageElem.classList.add("message", `${role}-message`);
    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = `<strong>${sender}:</strong><br>${text}`;
    messageElem.appendChild(contentDiv);
    if (role === 'bot') {
        const plainText = contentDiv.innerText.replace(`${sender}:`, '').trim();
        if (plainText.length > 10) {
            const voiceButton = document.createElement('button');
            voiceButton.className = 'voice-button';
            voiceButton.innerHTML = '🔊';
            voiceButton.title = 'Mesajı seslendir';
            voiceButton.onclick = (e) => handleVoiceButtonClick(e);
            voiceButton.setAttribute('data-text', plainText);
            messageElem.appendChild(voiceButton);
        }
    }
    chatBox.appendChild(messageElem);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (addToHistory && currentConversation) {
        currentConversation.push({ sender, text, role });
    }
}

function showLoadingIndicator() {
    hideLoadingIndicator();
    loadingMessageElement = document.createElement("div");
    loadingMessageElement.classList.add("message", "bot-message", "loading-indicator");
    loadingMessageElement.innerHTML = `<div class="dots-container"><span class="dot"></span><span class="dot"></span><span class="dot"></span></div>`;
    chatBox.appendChild(loadingMessageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function hideLoadingIndicator() {
    if (loadingMessageElement) {
        loadingMessageElement.remove();
        loadingMessageElement = null;
    }
}

function handleApiError(error, defaultMessage) {
    console.error(defaultMessage, error);
    hideLoadingIndicator();
    if(window.avatarSystem) window.avatarSystem.hide();
    appendMessage("SibelGPT", `❌ ${defaultMessage} Lütfen internet bağlantınızı kontrol edin.`, "bot", true);
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
    if(userInput) userInput.value = ""; 
    if(sendArrowButton) sendArrowButton.classList.remove('visible');
}

function handleNewChat() {
    saveCurrentConversation(); 
    clearChat(currentGptMode); 
    displayHistory(); 
    if(userInput) userInput.focus(); 
}

function playIntroVideo() {
  if (videoWrapper && introVideo && playButton) {
    videoWrapper.style.display = "flex";
    videoWrapper.classList.remove("fade-out");
    introVideo.muted = false;
    introVideo.currentTime = 0;
    introVideo.play().then(() => {
        playButton.textContent = "🔊 Oynatılıyor...";
        playButton.disabled = true;
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı:", e);
        videoWrapper.style.display = 'none';
    });
    introVideo.onended = () => {
      videoWrapper.classList.add("fade-out");
      playButton.textContent = "🎤 Dinle";
      playButton.disabled = false;
      setTimeout(() => {
          if (videoWrapper?.classList.contains('fade-out')) {
             videoWrapper.style.display = "none";
             videoWrapper.classList.remove("fade-out");
          }
      }, 1500);
    };
  }
}

// ==========================================================================
// 5. SES FONKSİYONLARI
// ==========================================================================

async function playBotMessage(text, buttonElement) {
  if (currentAudio && !currentAudio.paused) {
    stopAudio();
  }
  buttonElement.innerHTML = '⏳';
  buttonElement.disabled = true;
  playingButtonElement = buttonElement;

  try {
    const response = await fetch(`${BACKEND_URL}/generate-speech`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim() })
    });
    if (!response.ok) throw new Error('Ses oluşturulamadı');
    
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(audioUrl);
    
    currentAudio.onplay = () => buttonElement.innerHTML = '⏸️';
    currentAudio.onpause = () => buttonElement.innerHTML = '🔊';
    currentAudio.onended = () => {
      buttonElement.innerHTML = '🔊';
      currentAudio = null;
      playingButtonElement = null;
    };
    currentAudio.onerror = () => {
      buttonElement.innerHTML = '🔊';
      alert('Ses çalınamadı');
    };

    await currentAudio.play();
    buttonElement.disabled = false;
    
  } catch (error) {
    console.error('Ses oluşturma hatası:', error);
    buttonElement.innerHTML = '🔊';
    buttonElement.disabled = false;
    alert('Ses oluşturulamadı.');
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
  }
  if (playingButtonElement) {
    playingButtonElement.innerHTML = '🔊';
  }
  currentAudio = null;
  playingButtonElement = null;
}

function handleVoiceButtonClick(event) {
  const button = event.currentTarget;
  const text = button.getAttribute('data-text');
  
  if (currentAudio && playingButtonElement === button) {
    stopAudio();
  } else {
    stopAudio(); // Önce diğerini durdur
    playBotMessage(text, button);
  }
}

// ==========================================================================
// 6. SOHBET GEÇMİŞİ YÖNETİMİ
// ==========================================================================

function saveCurrentConversation() {
    if (!currentConversation || currentConversation.length <= 1) return;
    const conversations = loadConversations();
    const title = currentConversation.find(m => m.role === 'user')?.text.substring(0, 35) + '...' || "Yeni Sohbet";
    conversations.unshift({ id: Date.now(), title, mode: currentGptMode, messages: currentConversation });
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations.slice(0, 50)));
    } catch (e) {
        console.error("Geçmiş kaydedilemedi:", e);
    }
}

function loadConversations() {
    try {
        const stored = localStorage.getItem(HISTORY_STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (e) { return []; }
}

function displayHistory() {
    if (!historyList) return;
    const conversations = loadConversations();
    historyList.innerHTML = '';
    if (conversations.length === 0) {
        historyList.innerHTML = '<li>Henüz kaydedilmiş sohbet yok.</li>';
    } else {
        conversations.forEach(conv => {
            const modeIcon = { 'real-estate': '🏠', 'mind-coach': '🧠', 'finance': '💰' }[conv.mode] || '💬';
            const li = document.createElement('li');
            li.dataset.chatId = conv.id;
            li.innerHTML = `<span>${modeIcon} ${conv.title}</span><button class="delete-history-btn">🗑️</button>`;
            historyList.appendChild(li);
        });
    }
}

function handleHistoryClick(event) {
    const target = event.target;
    const li = target.closest('li[data-chat-id]');
    if (!li) return;

    if (target.classList.contains('delete-history-btn')) {
        deleteConversation(li.dataset.chatId);
    } else {
        loadConversation(li.dataset.chatId);
    }
}

function loadConversation(chatId) {
    saveCurrentConversation();
    const conversations = loadConversations();
    const conv = conversations.find(c => c.id == chatId);
    if (conv) {
        setGptMode(conv.mode || 'real-estate');
        chatBox.innerHTML = '';
        currentConversation = []; // Önce sıfırla
        conv.messages.forEach(msg => appendMessage(msg.sender, msg.text, msg.role, true)); // Tekrar geçmişe ekle
    }
}

function deleteConversation(chatId) {
    if (!confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) return;
    let conversations = loadConversations();
    conversations = conversations.filter(c => c.id != chatId);
    saveConversations(conversations);
    handleNewChat();
}

// ==========================================================================
// 7. HİSSE ANALİZİ MODAL FONKSİYONLARI
// ==========================================================================

function showStockModal() {
  if (!stockModal) return;
  const modalTitle = stockModal.querySelector('.modal-header h3');
  const confirmBtn = document.getElementById('modal-confirm');
  
  if(modalTitle) modalTitle.textContent = currentModalMode === 'technical' ? '📈 Teknik Analiz' : '📊 Hisse Analizi';
  if(confirmBtn) confirmBtn.textContent = currentModalMode === 'technical' ? 'Teknik Analiz' : 'Analiz Et';
  
  stockModal.style.display = 'flex';
  stockModal.classList.add('visible');
  if(stockSymbolInput) {
      stockSymbolInput.focus();
      stockSymbolInput.value = '';
  }
}

function hideStockModal() {
  if(stockModal) stockModal.classList.remove('visible');
  setTimeout(() => {
      if(stockModal) stockModal.style.display = 'none';
  }, 300); // Animasyonun bitmesini bekle
}

function handleStockAnalysis() {
  const symbol = stockSymbolInput.value.trim().toUpperCase();
  if (!symbol) {
    alert('Lütfen bir sembol girin!');
    return;
  }
  
  let fullSymbol = '';
  // ... (Sembol işleme mantığı buraya gelecek)
  if (symbol === 'BITCOIN' || symbol === 'BTC') fullSymbol = 'BINANCE:BTCUSD';
  else if (symbol === 'ETHEREUM' || symbol === 'ETH') fullSymbol = 'BINANCE:ETHUSD';
  else if (symbol === 'USDTRY' || symbol === 'USD/TRY') fullSymbol = 'FX:USDTRY';
  else if (symbol === 'EURTRY' || symbol === 'EUR/TRY') fullSymbol = 'FX:EURTRY';
  else if (symbol === 'GOLD' || symbol === 'ALTIN') fullSymbol = 'TVC:GOLD';
  else if (symbol === 'XU100' || symbol === 'BIST100') fullSymbol = 'BIST:XU100';
  else fullSymbol = `BIST:${symbol}`;
  
  const analysisUrl = currentModalMode === 'technical'
    ? `teknik-analiz.html?tvwidgetsymbol=${fullSymbol}`
    : `hisse-analizi.html?tvwidgetsymbol=${fullSymbol}`;
  
  window.open(analysisUrl, '_blank');
  hideStockModal();
}

// ==========================================================================
// 8. BAŞLATMA ve OLAY DİNLEYİCİLERİ
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
    // 1. Adım: Tüm DOM elementlerini seç
    chatBox = document.getElementById("chat-box");
    userInput = document.getElementById("user-input");
    sendArrowButton = document.getElementById("send-arrow-button");
    historyList = document.getElementById("history-list");
    mainInterface = document.getElementById("main-interface");
    newChatButton = document.querySelector(".new-chat-button button");
    helpButton = document.getElementById('help-button');
    actionMenuToggle = document.getElementById("action-menu-toggle");
    actionMenu = document.getElementById("action-menu");
    webSearchButton = document.getElementById("web-search-button");
    gorselButton = document.getElementById("gorsel-buton");
    loginButton = document.getElementById('login-button');
    loginModal = document.getElementById('login-modal');
    loginModalClose = document.getElementById('login-modal-close');
    googleLoginButton = document.getElementById('google-login-button');
    emailInput = document.getElementById('email-input');
    emailLoginButton = document.getElementById('email-login-button');
    userInfo = document.getElementById('user-info');
    userEmail = document.getElementById('user-email');
    logoutButton = document.getElementById('logout-button');
    loginContainer = document.getElementById('login-container');
    stockModal = document.getElementById('stock-modal');
    stockModalClose = document.getElementById('modal-close');
    stockModalCancel = document.getElementById('modal-cancel');
    stockModalConfirm = document.getElementById('modal-confirm');
    stockSymbolInput = document.getElementById('stock-symbol-input');
    videoWrapper = document.getElementById('video-wrapper');
    introVideo = document.getElementById('intro-video');
    playButton = document.getElementById('play-button');

    // 2. Adım: Supabase'i ve Auth sistemini başlat
    initializeSupabase();

    // 3. Adım: Tüm olay dinleyicilerini ata
    setupEventListeners();
    
    // 4. Adım: Splash ekranını yönet ve uygulamayı başlat
    startApplication();
});

function setupEventListeners() {
    // Genel Olaylar
    newChatButton?.addEventListener("click", handleNewChat);
    userInput?.addEventListener("keypress", (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }});
    userInput?.addEventListener('input', () => { sendArrowButton?.classList.toggle('visible', userInput.value.trim() !== ''); });
    sendArrowButton?.addEventListener('click', sendMessage);
    historyList?.addEventListener('click', handleHistoryClick);
    helpButton?.addEventListener('click', () => window.open('help.html', '_blank'));
    playButton?.addEventListener('click', playIntroVideo);

    // Aksiyon Menüsü Olayları
    const closeActionMenu = () => {
        actionMenu?.classList.remove('visible');
        actionMenuToggle?.classList.remove('active');
    };
    actionMenuToggle?.addEventListener('click', (e) => {
        e.stopPropagation();
        actionMenu.classList.toggle('visible');
        actionMenuToggle.classList.toggle('active');
    });
    webSearchButton?.addEventListener('click', () => { performWebSearch(); closeActionMenu(); });
    gorselButton?.addEventListener('click', () => { handleGenerateImageClick(); closeActionMenu(); });
    document.addEventListener('click', (e) => {
        if (actionMenuToggle && actionMenu && !actionMenuToggle.contains(e.target) && !actionMenu.contains(e.target)) {
            closeActionMenu();
        }
    });

    // GPT Mod Butonları
    document.getElementById('real-estate-gpt')?.addEventListener('click', () => setGptMode('real-estate'));
    document.getElementById('mind-coach-gpt')?.addEventListener('click', () => setGptMode('mind-coach'));
    document.getElementById('finance-gpt')?.addEventListener('click', () => setGptMode('finance'));
    
    // Hisse Senedi Modal Olayları
    document.getElementById('stock-analysis-btn')?.addEventListener('click', () => { currentModalMode = 'stock'; showStockModal(); });
    document.getElementById('technical-analysis-btn')?.addEventListener('click', () => { currentModalMode = 'technical'; showStockModal(); });
    stockModalClose?.addEventListener('click', hideStockModal);
    stockModalCancel?.addEventListener('click', hideStockModal);
    stockModalConfirm?.addEventListener('click', handleStockAnalysis);
    stockSymbolInput?.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleStockAnalysis(); });
    document.querySelectorAll('.example-symbol').forEach(symbol => {
        symbol.addEventListener('click', () => {
            if (stockSymbolInput) stockSymbolInput.value = symbol.getAttribute('data-symbol');
        });
    });
}

function startApplication() {
    const splashScreen = document.getElementById("splash-screen");
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.style.opacity = 0;
            if(mainInterface) mainInterface.style.display = "flex";
            setTimeout(() => {
                splashScreen.style.display = "none";
                if(mainInterface) mainInterface.style.opacity = 1;
                if(userInput) userInput.focus();
            }, 600);
        }, 3500);
    } else {
        if(mainInterface) { mainInterface.style.display = "flex"; mainInterface.style.opacity = 1; }
        if(userInput) userInput.focus();
    }
    setGptMode('real-estate');
    displayHistory();
}

window.addEventListener('beforeunload', saveCurrentConversation);

async function initializeSupabase() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/config`);
        if (!response.ok) throw new Error('Config alınamadı');
        const config = await response.json();
        
        supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        console.log("Supabase güvenli şekilde başlatıldı.");

        // Auth UI olay dinleyicilerini kur
        setupAuthEventListeners();

        // Sayfa yüklendiğindeki mevcut kullanıcıyı kontrol et
        const { data: { session } } = await supabase.auth.getSession();
        updateUserUI(session?.user ?? null);

        // Auth durumundaki tüm değişiklikleri canlı olarak dinle
        supabase.auth.onAuthStateChange((_event, session) => {
            console.log("Auth durumu değişti:", _event);
            updateUserUI(session?.user ?? null);
            if (_event === 'SIGNED_IN') {
                displayHistory(); 
            }
        });

    } catch (error) {
        console.error("Supabase başlatma hatası:", error);
        alert("Uygulama başlatılırken bir sorun oluştu. Lütfen sayfayı yenileyin.");
    }
}
