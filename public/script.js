import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// script.js - GÜNCELLENMİŞ HALİ (Web Araması Eklendi)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton; 
let gorselButton;
let webSearchButton; 
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
            document.body.className = 'theme-real-estate';
            break;
        case 'mind-coach':
            activeButton = document.getElementById('mind-coach-gpt');
            document.body.className = 'theme-mind-coach';
            break;
        case 'finance':
            activeButton = document.getElementById('finance-gpt');
            document.body.className = 'theme-finance';
            break;
    }
    
    if (activeButton) {
        activeButton.classList.add('active');
    }
    
    // Tema değişim animasyonu
    document.body.style.animation = 'none';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 10);
    
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

// ✅ Web araması işlevi - Güncellenmiş Hali (Backend API ile entegre)
async function performWebSearch() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen arama için bir soru veya anahtar kelime yazın.");
        return;
    }
    
    appendMessage("Sen", prompt, "user", true); // Kullanıcının sorusunu ekle
    showLoadingIndicator(); // Yükleniyor animasyonunu göster
    userInput.value = "";
    if (sendArrowButton) {
        sendArrowButton.classList.remove('visible');
    }
    
    try {
        // Backend API'nin web-search endpoint'ine istek gönder
        const response = await fetch(`${BACKEND_URL}/web-search`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                question: prompt,
                mode: currentGptMode // Seçilen modu gönder
            }),
        });
        
        hideLoadingIndicator(); // Yükleniyor animasyonunu kaldır
        
        const data = await response.json();
        const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
        appendMessage("SibelGPT", reply, "bot", true);
        
    } catch (error) {
        hideLoadingIndicator(); // Hata durumunda da animasyonu kaldır
        console.error("Web arama hatası:", error);
        appendMessage("SibelGPT", "⚠️ Web araması sırasında bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    }
}

// ✅ Görsel butonuna tıklandığında çağrılacak görsel üretim işlevi
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
                    <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: var(--theme-primary); color: white; cursor: pointer;">
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
      }),
    });
    
    hideLoadingIndicator(); // Cevap gelince animasyonu kaldır

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot", true); 

  } catch (error) {
     hideLoadingIndicator(); // Hata durumunda da animasyonu kaldır
     appendMessage("SibelGPT", "❌ Bir sunucu hatası oluştu veya sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    console.error("Mesaj gönderirken hata:", error);
  }
}

// Mesajı ekrana ve geçmişe ekler
function appendMessage(sender, text, role, addToHistory = false) {
    if (!chatBox) return;

    const messageElem = document.createElement("div");
    messageElem.classList.add("message");
    messageElem.classList.add(role + "-message");

    messageElem.innerHTML = `<strong>${sender}:</strong><br>`;

    const contentDiv = document.createElement('div');
    contentDiv.innerHTML = text;
    messageElem.appendChild(contentDiv);

    chatBox.appendChild(messageElem);

    if (addToHistory && currentConversation) {
        currentConversation.push({ sender, text, role });
    }

    setTimeout(() => {
        chatBox.scrollTop = chatBox.scrollHeight;
    }, 100);
}

// Görsel indirme fonksiyonu
function indirGorsel(url) {
  window.open(url, '_blank'); 
}

// Enter tuşuna basılınca mesaj gönder
function handleInputKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) { 
    event.preventDefault(); 
    if(userInput && userInput.value.trim() !== '') { 
       sendMessage();
    }
  }
}

// -------- History, Conversation, Clear vb. Fonksiyonlar (Değişiklik Yok) --------
// Sohbet geçmişini Local Storage'dan yükle
function loadConversations() {
  const conversationsJson = localStorage.getItem(HISTORY_STORAGE_KEY);
  try {
    return conversationsJson ? JSON.parse(conversationsJson) : [];
  } catch (e) {
    console.error("Sohbet geçmişi yüklenirken hata:", e);
    localStorage.removeItem(HISTORY_STORAGE_KEY); 
    return [];
  }
}
// Sohbet geçmişini Local Storage'a kaydet
function saveConversations(conversations) {
  try {
    const MAX_HISTORY = 50;
    if (conversations.length > MAX_HISTORY) {
      conversations = conversations.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Sohbet geçmişi kaydedilirken hata:", e);
     if (e.name === 'QuotaExceededError' && conversations.length > 0) {
         console.warn("Depolama alanı dolu, en eski sohbet siliniyor.");
         saveConversations(conversations.slice(0, conversations.length - 1));
     }
  }
}
// Mevcut sohbeti kaydet (eğer anlamlıysa)
function saveCurrentConversation() {
  if (!currentConversation || currentConversation.length <= 1) return; 
  const chatId = Date.now(); 
  const title = generateConversationTitle(currentConversation);
  const conversations = loadConversations();
  conversations.unshift({ 
    id: chatId, 
    title: title, 
    messages: currentConversation,
    mode: currentGptMode // Kayıt yaparken modu da kaydedelim
  }); 
  saveConversations(conversations);
}
// Sohbet için başlık oluştur
function generateConversationTitle(conversation) {
  const firstUserMessage = conversation.find(msg => msg.role === 'user');
  if (firstUserMessage?.text) {
    const text = firstUserMessage.text.trim();
    if (text.toLowerCase().includes("görsel") || text.toLowerCase().includes("çiz")) {
        return "Görsel Sohbeti";
    }
    if (text.toLowerCase().includes("web") || text.toLowerCase().includes("ara")) {
        return "Web Araması";
    }
    return text.length > 35 ? text.substring(0, text.lastIndexOf(' ', 35) || 35) + '...' : text;
  }
  return "Yeni Sohbet Başlığı"; 
}
// Sohbeti temizle
function clearChat(mode) {
  if(!chatBox) return;
  chatBox.innerHTML = ''; 
  
  let welcomeMessage = '';
  
  // Seçilen moda göre karşılama mesajını belirle
  switch(mode) {
    case 'mind-coach':
      welcomeMessage = `<strong>SibelGPT:</strong> Merhaba! Zihin Koçu modunu seçtiniz. Size kişisel gelişim, motivasyon ve zihinsel sağlık konularında rehberlik edebilirim. Hayatınızdaki zorlukları aşmanıza veya hedeflerinize ulaşmanıza nasıl yardımcı olabilirim?`;
      break;
    case 'finance':
      welcomeMessage = `<strong>SibelGPT:</strong> Merhaba! Finans GPT modunu seçtiniz. Yatırım stratejileri, finansal planlama, bütçe yönetimi ve finansal hedeflerinize ulaşma konularında size yardımcı olabilirim. Finansal konularda nasıl yardımcı olabilirim?`;
      break;
    default: // real-estate veya tanımlanmamış bir mod
      welcomeMessage = `<strong>SibelGPT:</strong> Merhaba! Gayrimenkul GPT modunu seçtiniz. İdeal evinizi bulmanıza, gayrimenkul yatırımlarınızı değerlendirmenize ve emlak sektörüyle ilgili sorularınızı yanıtlamanıza yardımcı olabilirim. Size nasıl yardımcı olabilirim?`;
      break;
  }
  
  const initialBotMessageElem = document.createElement("div");
  initialBotMessageElem.classList.add("message", "bot-message");
  initialBotMessageElem.innerHTML = welcomeMessage;
  chatBox.appendChild(initialBotMessageElem);
  
  currentConversation = [{ 
      sender: 'SibelGPT',
      text: welcomeMessage.replace(/<strong>.*?<\/strong>/g, '').trim(), 
      role: 'bot'
  }];
  
  highlightSelectedChat(null); 
  if(userInput) userInput.value = ""; 
  if(sendArrowButton) sendArrowButton.classList.remove('visible'); 
}

// Geçmiş sohbetleri kenar çubuğunda göster
function displayHistory() {
  if(!historyList) return; 
  const conversations = loadConversations();
  historyList.innerHTML = ''; 
  if (conversations.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'Henüz kaydedilmiş sohbet yok.';
    placeholder.style.cursor = 'default';
    placeholder.style.opacity = '0.7';
    historyList.appendChild(placeholder);
  } else {
    conversations.forEach(conv => {
      const listItem = document.createElement('li');
      
      // Sohbet başlığını mod ikonu ile göster
      let modeIcon = '🏠'; // Varsayılan
      if (conv.mode === 'mind-coach') modeIcon = '🧠';
      else if (conv.mode === 'finance') modeIcon = '💰';
      
      listItem.textContent = `${modeIcon} ${conv.title || "Adsız Sohbet"}`; 
      listItem.setAttribute('data-chat-id', conv.id);
      listItem.setAttribute('data-chat-mode', conv.mode || 'real-estate');
      
      const deleteButton = document.createElement('span');
      deleteButton.textContent = '🗑️';
      deleteButton.style.float = 'right';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.marginLeft = '10px';
      deleteButton.style.visibility = 'hidden'; 
      deleteButton.onclick = (e) => {
          e.stopPropagation(); 
          deleteConversation(conv.id);
      };
      listItem.onmouseover = () => { deleteButton.style.visibility = 'visible'; };
      listItem.onmouseout = () => { deleteButton.style.visibility = 'hidden'; };
      listItem.appendChild(deleteButton);
      historyList.appendChild(listItem);
    });
  }
}
// Seçili sohbeti yükle
function loadConversation(chatId) {
  saveCurrentConversation(); 
  const conversations = loadConversations();
  const conversationToLoad = conversations.find(conv => conv.id == chatId); 
  if (conversationToLoad) {
    // Önce modu ayarla
    const mode = conversationToLoad.mode || 'real-estate';
    setGptMode(mode);
    
    clearChat(mode); 
    currentConversation = [{ 
        sender: 'SibelGPT',
        text: chatBox.querySelector('.bot-message').textContent.replace('SibelGPT:', '').trim(),
        role: 'bot'
    }];
    conversationToLoad.messages.forEach((msg, index) => {
       if (index > 0) { 
           appendMessage(msg.sender, msg.text, msg.role, false); 
       }
    });
    currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages)); 
    highlightSelectedChat(chatId); 
    if(userInput) userInput.focus(); 
  } else {
      console.error("Sohbet bulunamadı:", chatId);
  }
}
// Kenar çubuğunda seçili sohbeti vurgula
function highlightSelectedChat(chatId) {
    if (!historyList) return;
    historyList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    if (chatId !== null) {
        const selectedItem = historyList.querySelector(`li[data-chat-id="${chatId}"]`);
        if (selectedItem) selectedItem.classList.add('selected');
    }
}
// Geçmiş listesinden bir sohbete tıklandığında
function handleHistoryClick(event) {
  const clickedElement = event.target;
  const listItem = clickedElement.closest('li'); 
  if (listItem && listItem.hasAttribute('data-chat-id')) {
       if (event.target.tagName === 'SPAN' && event.target.textContent === '🗑️') {
           return;
       }
       const chatId = listItem.getAttribute('data-chat-id');
       loadConversation(chatId);
       if(userInput) userInput.focus();
  }
}
// Bir sohbeti silme fonksiyonu
function deleteConversation(chatId) {
    if (!confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
        return;
    }
    let conversations = loadConversations();
    conversations = conversations.filter(conv => conv.id != chatId);
    saveConversations(conversations);
    displayHistory(); 
    const selectedLi = historyList ? historyList.querySelector('.selected') : null;
     if (!selectedLi || selectedLi.getAttribute('data-chat-id') == chatId) {
         handleNewChat(); 
     }
}
// Yeni sohbet butonu işlevi
function handleNewChat() {
  saveCurrentConversation(); 
  clearChat(currentGptMode); 
  displayHistory(); 
  if(userInput) userInput.focus(); 
}
// -------- History, Conversation, Clear vb. Fonksiyonlar Sonu --------


// Sayfa yüklendiğinde çalışacak kodlar
window.addEventListener("load", () => {
  // ✅ Üye Ol / Giriş (E-Posta OTP) Butonları
  const emailButtons = document.querySelectorAll('.register-button, .login-button');
  emailButtons.forEach(btn => {
    btn.addEventListener('click', async () => {
      const email = prompt("Lütfen e-posta adresinizi girin:");
      if (!email) return;
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) {
        alert("Hata: " + error.message);
      } else {
        alert("E-posta adresinize giriş bağlantısı gönderildi.");
      }
    });
  });

  // ✅ Google ile Giriş Butonu
  const googleBtn = document.getElementById("google-login");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      console.log("Google GİRİŞ tıklandı");
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
      });
      if (error) {
        alert("Google ile girişte hata oluştu: " + error.message);
      }
    });
  }

  // ✅ Çıkış Butonu
  const logoutBtn = document.getElementById("logout-button");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      await supabase.auth.signOut();
      alert("Çıkış yapıldı.");
      location.reload();
    });
  }

  // ✅ Kullanıcı Giriş Yaptıysa Maili Göster
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      const mailAlani = document.getElementById('kullanici-maili-alani');
      if (mailAlani) {
        mailAlani.innerHTML = `<div style="margin-top: 8px; font-size: 13px; color: #ccc;"><i class="fas fa-user"></i> ${user.email}</div>`;
      }
    }
  });

  // Elementleri seç
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");
  mainInterface = document.getElementById("main-interface");
  sendArrowButton = document.getElementById('send-arrow-button'); 
  gorselButton = document.getElementById('gorsel-buton'); 
  webSearchButton = document.getElementById('web-search-button'); // YENİ: Web Araması butonunu seç
  videoWrapper = document.getElementById('video-wrapper'); 
  introVideo = document.getElementById('intro-video');     
  playButton = document.getElementById('play-button');     

  // GPT Mod Butonları
  const realEstateBtn = document.getElementById('real-estate-gpt');
  const mindCoachBtn = document.getElementById('mind-coach-gpt');
  const financeBtn = document.getElementById('finance-gpt');
  
  // GPT Mod butonu olaylarını ekle
  if (realEstateBtn) {
    realEstateBtn.addEventListener('click', () => setGptMode('real-estate'));
  }
  if (mindCoachBtn) {
    mindCoachBtn.addEventListener('click', () => setGptMode('mind-coach'));
  }
  if (financeBtn) {
    financeBtn.addEventListener('click', () => setGptMode('finance'));
  }

  // Başlangıçta varsayılan mod için body sınıfını ayarla
  document.body.className = 'theme-real-estate';

  // Splash ekranını yönet - DÜZELTİLDİ
  if (splashScreen) {
      splashScreen.addEventListener('animationend', (event) => {
          if (event.target.classList.contains('splash-logo')) { 
              // Doğrudan gösterilmesi için düzeltme yapıyoruz
              splashScreen.style.opacity = 0;
              splashScreen.style.display = "none"; // Tamamen gizle
              
              if(mainInterface) {
                  mainInterface.style.display = "flex";
                  mainInterface.style.opacity = 1; // Görünürlüğünü garanti et
              }
              
              initializeChatInterface();
              
              if (videoWrapper) {
                  videoWrapper.style.display = "flex"; 
              }
          }
      });
  } else {
      // Splash screen yoksa hemen göster
      if(mainInterface) {
          mainInterface.style.display = "flex";
          mainInterface.style.opacity = 1;
      }
      initializeChatInterface();
      if (videoWrapper) {
          videoWrapper.style.display = "flex";
      }
  }

  // Olay dinleyicilerini ekle
  if (userInput) {
      userInput.addEventListener("keypress", handleInputKeyPress);
      userInput.addEventListener('input', () => {
          if (sendArrowButton) { 
              if (userInput.value.trim() !== '') {
                  sendArrowButton.classList.add('visible');
              } else {
                  sendArrowButton.classList.remove('visible');
              }
          }
      });
  }
  if (newChatButton) {
      newChatButton.addEventListener("click", handleNewChat);
  }
  if (historyList) {
      historyList.addEventListener("click", handleHistoryClick);
  }
  if (sendArrowButton) { 
      sendArrowButton.addEventListener('click', sendMessage);
  }
  if (gorselButton) { 
      gorselButton.addEventListener('click', handleGenerateImageClick);
  }
  // YENİ: Web araması butonu için olay dinleyici
  if (webSearchButton) {
      webSearchButton.addEventListener('click', performWebSearch);
  }
   if (playButton) { 
       playButton.addEventListener('click', playIntroVideo);
   }

  // Başlangıç
  clearChat(currentGptMode); // Ekranı temizle ve başlangıç mesajını/sohbetini ayarla
  displayHistory(); // Mevcut geçmişi göster
  setTimeout(() => { if(userInput) userInput.focus(); }, 600); 
});

// Ana arayüz başlatıldığında çağrılır
function initializeChatInterface() {
    // Display history burada çağrılıyor zaten load event'inde.
    // displayHistory(); 
}

// Avatar videosunu oynat
function playIntroVideo() {
  const video = introVideo || document.getElementById("intro-video");
  const wrapper = videoWrapper || document.getElementById("video-wrapper");
  const button = playButton || document.getElementById("play-button");

  if (video && wrapper && button) {
    wrapper.style.display = "flex"; 
    wrapper.classList.remove("fade-out"); 
    
    // Videoyu görünür yapalım (CSS'de display:none yoksa zaten görünür olabilir)
    // video.style.display = 'block'; // Eğer CSS'de gizliyse bunu aç

    video.muted = false; 
    video.currentTime = 0;
    
    video.play().then(() => {
        button.textContent = "🔊 Oynatılıyor..."; 
        button.disabled = true; 
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı:", e);
        wrapper.style.display = 'none'; 
    });

    video.onended = () => {
      wrapper.classList.add("fade-out");
      button.textContent = "🎤 Dinle"; 
      button.disabled = false; 
      
      setTimeout(() => {
          if (wrapper.classList.contains('fade-out')) { 
             wrapper.style.display = "none"; 
             // video.style.display = 'none'; // Videoyu da gizle
             wrapper.classList.remove("fade-out"); 
          }
      }, 1500); 
    };
  } else {
      console.error("Video veya kontrol elemanları bulunamadı!");
  }
}

// indirGorsel fonksiyonunu window nesnesine ekleyelim ki HTML içinden çağrılabilsin
window.indirGorsel = indirGorsel;

// Sayfa kapanmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
  saveCurrentConversation();
});

const supabaseUrl = 'https://qkjyysjbtfxwyyypuhzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFranl5c2pidGZ4d3l5eXB1aHpzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU4MzE5MjYsImV4cCI6MjA2MTQwNzkyNn0.k1GvvvoYYqXKPJzx27wBB5ncqPHqnObW_b67spw4c1E';
const supabase = createClient(supabaseUrl, supabaseKey);

// Supabase OTP login işlemi
async function handleLoginOrSignup() {
  const email = prompt("Lütfen e-posta adresinizi girin:");
  if (!email) return;
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) {
    alert("Hata: " + error.message);
  } else {
    alert("E-posta adresinize giriş bağlantısı gönderildi.");
  }
}

// DOM yüklendikten sonra olay dinleyicilerini ekle
document.addEventListener('DOMContentLoaded', () => {
  // Üye Ol ve Giriş butonları
  document.querySelectorAll('.register-button, .login-button').forEach(button => {
    button.addEventListener('click', handleLoginOrSignup);
  });
  
  // Çıkış butonu
  const logoutButton = document.getElementById('logout-button');
  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await supabase.auth.signOut();
      alert("Çıkış yapıldı.");
      location.reload();
    });
  }
});
