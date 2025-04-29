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
                    <img src="${data.image_url}" alt="Üretilen Görsel" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;" />
                    <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #8e24aa; color: white; cursor: pointer;">
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

  appendMessage("Sen", message, "user", true);
  showLoadingIndicator();
  userInput.value = "";
  if (sendArrowButton) {
      sendArrowButton.classList.remove('visible');
  }

  try {
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    hideLoadingIndicator();

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot", true);

  } catch (error) {
     hideLoadingIndicator();
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

    messageElem.innerHTML = `<strong>${sender}:</strong> `;

    if (typeof text === 'string' && text.trim().startsWith('<div')) {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = text;
         while (contentDiv.firstChild) {
             messageElem.appendChild(contentDiv.firstChild);
         }
    } else if (typeof text === 'string') { // Sadece string ise metin düğümü oluştur
         const textNode = document.createTextNode(text);
         messageElem.appendChild(textNode);
    } else {
        // Eğer text bir HTML elementi veya başka bir node ise doğrudan ekle
        // (Bu durum genellikle olmaz ama güvenlik için kontrol)
        try {
             messageElem.appendChild(text);
        } catch (e) {
            console.error("Mesaj eklenirken beklenmeyen veri tipi:", text, e);
             const textNode = document.createTextNode("[Mesaj içeriği görüntülenemiyor]");
             messageElem.appendChild(textNode);
        }
    }


    chatBox.appendChild(messageElem);

    if (addToHistory && currentConversation) {
        // Metin içeriğini alırken HTML'i düz metne çevirmeye çalışalım (isteğe bağlı)
        let historyText = text;
        if (typeof text === 'string' && text.includes('<img')) {
            historyText = "[Üretilen Görsel]"; // Görseli geçmişte metinle temsil et
        } else if (typeof text === 'string' && text.includes('<')) {
             // Diğer HTML'leri basitçe metne çevir
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = text;
             historyText = tempDiv.textContent || tempDiv.innerText || "[Karmaşık İçerik]";
        }
        currentConversation.push({ sender, text: historyText, role });
    }

    setTimeout(() => {
        if(chatBox) chatBox.scrollTop = chatBox.scrollHeight; // null kontrolü
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
    if(userInput && userInput.value.trim() !== '') { // null kontrolü
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
      conversations = conversations.slice(conversations.length - MAX_HISTORY); // En yeni 50'yi tut
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Sohbet geçmişi kaydedilirken hata:", e);
     if (e.name === 'QuotaExceededError' && conversations.length > 0) {
         console.warn("Depolama alanı dolu, en eski sohbet siliniyor.");
         saveConversations(conversations.slice(1)); // En eskiden 1 tane sil
     }
  }
}
// Mevcut sohbeti kaydet (eğer anlamlıysa)
function saveCurrentConversation() {
  if (!currentConversation || currentConversation.length <= 1) return; // Başlangıç mesajı hariç mesaj yoksa kaydetme
  const chatId = currentConversation[0]?.chatId || Date.now(); // Varsa mevcut ID'yi kullan, yoksa yeni oluştur
  const title = generateConversationTitle(currentConversation);
  let conversations = loadConversations();
  const existingIndex = conversations.findIndex(c => c.id === chatId);
  const conversationData = { id: chatId, title: title, messages: currentConversation, lastUpdated: Date.now() };

  if (existingIndex > -1) {
      conversations[existingIndex] = conversationData; // Var olanı güncelle
  } else {
      conversations.unshift(conversationData); // Yeni sohbeti başa ekle
  }
  // Tarihe göre sırala (en yeni üstte) - İsteğe bağlı
  conversations.sort((a, b) => (b.lastUpdated || b.id) - (a.lastUpdated || a.id));

  saveConversations(conversations);
}
// Sohbet için başlık oluştur
function generateConversationTitle(conversation) {
  const firstUserMessage = conversation.find(msg => msg.role === 'user');
  if (firstUserMessage?.text) {
    const text = String(firstUserMessage.text).trim(); // String'e çevir ve trim yap
    if (text.toLowerCase().includes("görsel") || text.toLowerCase().includes("çiz") || text === "[Üretilen Görsel]") {
        return "🖼️ Görsel Sohbeti"; // Emoji eklendi
    }
     // Başlıkta HTML olmamasını sağla
     const tempDiv = document.createElement('div');
     tempDiv.innerHTML = text;
     const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    return cleanText.length > 35 ? cleanText.substring(0, cleanText.lastIndexOf(' ', 35) || 35) + '...' : (cleanText || "Yeni Sohbet");
  }
  return "💬 Yeni Sohbet"; // Emoji eklendi
}
// Sohbeti temizle
function clearChat() {
  if(!chatBox) return;
  chatBox.innerHTML = '';
  const initialBotMessageHTML = `<strong>SibelGPT:</strong> Merhaba! Ben SibelGPT, dijital asistanınız. Gayrimenkul, numeroloji, finans ve kişisel gelişim konularında size yardımcı olabilirim. Nasıl başlayabiliriz?`;
  const initialBotMessageElem = document.createElement("div");
  initialBotMessageElem.classList.add("message", "bot-message");
  initialBotMessageElem.innerHTML = initialBotMessageHTML;
  chatBox.appendChild(initialBotMessageElem);
  currentConversation = [{
      sender: 'SibelGPT',
      text: initialBotMessageHTML.replace(/<strong>.*?<\/strong>/g, '').trim(),
      role: 'bot',
      chatId: Date.now() // Yeni sohbet için yeni ID
  }];
  highlightSelectedChat(null);
  if(userInput) userInput.value = "";
  if(sendArrowButton) sendArrowButton.classList.remove('visible');
}
// Geçmiş sohbetleri kenar çubuğunda göster
function displayHistory() {
  if(!historyList) return;
  const conversations = loadConversations();
  // Tarihe göre sırala (en yeni üstte)
  conversations.sort((a, b) => (b.lastUpdated || b.id) - (a.lastUpdated || a.id));

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
      listItem.textContent = conv.title || "Adsız Sohbet";
      listItem.setAttribute('data-chat-id', conv.id);

      // Silme butonu
      const deleteButton = document.createElement('span');
      deleteButton.innerHTML = '🗑️'; // ikonu doğrudan innerHTML ile
      deleteButton.title = "Sohbeti Sil";
      deleteButton.style.cssText = `
          float: right;
          cursor: pointer;
          margin-left: 10px;
          visibility: hidden;
          opacity: 0.7;
          transition: opacity 0.2s ease;
          font-size: 14px; /* Biraz küçülttük */
          padding: 0 3px; /* Tıklama alanını hafif genişlet */
      `;
      deleteButton.onclick = (e) => {
          e.stopPropagation();
          deleteConversation(conv.id);
      };
      deleteButton.onmouseover = () => { deleteButton.style.opacity = '1'; };
      deleteButton.onmouseout = () => { deleteButton.style.opacity = '0.7'; };


      listItem.appendChild(deleteButton);
      listItem.onmouseover = () => { deleteButton.style.visibility = 'visible'; };
      listItem.onmouseout = () => { deleteButton.style.visibility = 'hidden'; };

      historyList.appendChild(listItem);
    });
  }
}
// Seçili sohbeti yükle
function loadConversation(chatId) {
  saveCurrentConversation(); // Önce mevcut sohbeti kaydet
  const conversations = loadConversations();
  const conversationToLoad = conversations.find(conv => conv.id == chatId);
  if (conversationToLoad) {
    clearChat(); // Ekranı temizle
    currentConversation = [{ // Başlangıç mesajını ayarla (ama yeni ID ile değil, yüklenen ID ile)
        sender: 'SibelGPT',
        text: chatBox.querySelector('.bot-message')?.textContent?.replace('SibelGPT:', '').trim() || "Merhaba!", // null kontrolü
        role: 'bot',
        chatId: conversationToLoad.id // Yüklenen sohbetin ID'sini kullan
    }];

    conversationToLoad.messages.forEach((msg, index) => {
       // İlk mesajı (botun başlangıç mesajı) tekrar ekleme, zaten clearChat ekledi
       if (index > 0) {
           appendMessage(msg.sender, msg.text, msg.role, false); // Geçmişe ekleme (false)
       }
    });
    // currentConversation'ı yüklenen mesajlarla güncelle
    currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));
    // Yüklenen sohbetin ID'sini ilk mesaja da ekleyelim (tutarlılık için)
    if(currentConversation[0]) {
        currentConversation[0].chatId = conversationToLoad.id;
    }

    highlightSelectedChat(chatId);
    if(userInput) userInput.focus(); // null kontrolü
  } else {
      console.error("Sohbet bulunamadı:", chatId);
      handleNewChat(); // Sohbet bulunamazsa yeni sohbet başlat
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
  // Doğrudan silme ikonuna tıklanmadıysa devam et
  if (clickedElement.innerHTML === '🗑️') {
      return;
  }
  const listItem = clickedElement.closest('li');
  if (listItem && listItem.hasAttribute('data-chat-id')) {
       const chatId = listItem.getAttribute('data-chat-id');
       loadConversation(chatId);
       if(userInput) userInput.focus(); // null kontrolü
  }
}
// Bir sohbeti silme fonksiyonu
function deleteConversation(chatId) {
    if (!confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
        return;
    }
    let conversations = loadConversations();
    const initialLength = conversations.length;
    conversations = conversations.filter(conv => conv.id != chatId);

    if (conversations.length < initialLength) { // Silme başarılı olduysa
        saveConversations(conversations);
        displayHistory(); // Listeyi yenile

        const selectedLi = historyList ? historyList.querySelector('.selected') : null; // null kontrolü
         // Silinen sohbet seçili olan mıydı? Veya hiç sohbet kalmadı mı?
         if (conversations.length === 0 || (selectedLi && selectedLi.getAttribute('data-chat-id') == chatId)) {
             handleNewChat(); // Yeni boş sohbet başlat
         }
    } else {
        console.warn("Silinecek sohbet bulunamadı:", chatId);
    }
}
// Yeni sohbet butonu işlevi
function handleNewChat() {
  saveCurrentConversation(); // Varsa mevcut sohbeti kaydet
  clearChat(); // Ekranı temizle ve yeni ID ile başlangıç mesajını ayarla
  displayHistory(); // Kenar çubuğunu yenile (yeni sohbet başa gelmeli)
  if(userInput) userInput.focus(); // null kontrolü
}
// -------- History, Conversation, Clear vb. Fonksiyonlar Sonu --------


// Sayfa yüklendiğinde çalışacak kodlar
window.addEventListener("load", () => {
  // Elementleri seç
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");
  mainInterface = document.getElementById("main-interface");
  sendArrowButton = document.getElementById('send-arrow-button');
  gorselButton = document.getElementById('gorsel-buton');
  searchButton = document.getElementById('search-button'); // *** YENİ BUTON SEÇİMİ ***
  videoWrapper = document.getElementById('video-wrapper');
  introVideo = document.getElementById('intro-video');
  playButton = document.getElementById('play-button');

  // Splash ekranını yönet
  if (splashScreen) {
      splashScreen.addEventListener('animationend', (event) => {
          // Sadece logo animasyonu bittiğinde tetikle
          if (event.animationName === 'fadeInOut' && event.target === splashScreen.querySelector('.splash-logo')) {
              splashScreen.style.opacity = 0;
              setTimeout(() => {
                  splashScreen.style.display = "none";
                  if(mainInterface) mainInterface.style.display = "flex"; // Ana arayüzü göster
                  initializeChatInterface(); // Sohbet arayüzünü başlat
                  if (videoWrapper && !localStorage.getItem('introPlayed')) { // Daha önce oynatılmadıysa göster
                      videoWrapper.style.display = "flex";
                      // localStorage.setItem('introPlayed', 'true'); // Tekrar göstermemek için işaretle
                  }
              }, 500); // Opacity geçişi için bekle
          }
      });
      // Güvenlik önlemi: Eğer animasyon bir şekilde tetiklenmezse belirli bir süre sonra yine de kaldır
       setTimeout(() => {
            if (splashScreen.style.display !== 'none') {
                 splashScreen.style.opacity = 0;
                 setTimeout(() => {
                     splashScreen.style.display = "none";
                      if(mainInterface) mainInterface.style.display = "flex";
                      initializeChatInterface();
                       if (videoWrapper && !localStorage.getItem('introPlayed')) {
                           videoWrapper.style.display = "flex";
                      }
                 }, 500);
            }
       }, 5000); // 5 saniye sonra

  } else {
       // Splash ekranı yoksa doğrudan başlat
       if(mainInterface) mainInterface.style.display = "flex";
       initializeChatInterface();
        if (videoWrapper && !localStorage.getItem('introPlayed')) {
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
  // *** YENİ BUTON İÇİN OLAY DİNLEYİCİSİ ***
  if (searchButton) {
      searchButton.addEventListener('click', handleInternetSearchClick);
  }
  // *** -------------------------------- ***
   if (playButton) {
       playButton.addEventListener('click', playIntroVideo);
   }

   // Başlangıçta ekranı temizle ve geçmişi yükle (Initialize içinde değil, burada)
   initializeChatInterface(); // Bu fonksiyon şimdi daha çok başlangıç ayarları yapacak

   // Kullanıcı arayüzü göründükten sonra input'a odaklan
   setTimeout(() => { if(userInput) userInput.focus(); }, 600); // Biraz gecikme
});

// Ana arayüz başlatıldığında çağrılır (Artık sadece başlangıç ayarları)
function initializeChatInterface() {
    clearChat(); // Ekranı temizle ve başlangıç mesajını ayarla
    displayHistory(); // Mevcut geçmişi göster
}


// Avatar videosunu oynat
function playIntroVideo() {
  const video = introVideo || document.getElementById("intro-video");
  const wrapper = videoWrapper || document.getElementById("video-wrapper");
  const button = playButton || document.getElementById("play-button");

  if (video && wrapper && button) {
    wrapper.style.display = "flex"; // Görünür yap
    wrapper.classList.remove("fade-out"); // Solma animasyonunu kaldır (varsa)

    video.muted = false; // Sesi aç
    video.currentTime = 0; // Başa sar

    video.play().then(() => {
        button.textContent = "🔊 Oynatılıyor...";
        button.disabled = true; // Oynarken butonu pasif yap
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı, kullanıcı etkileşimi gerekebilir:", e);
        // Otomatik oynatma engellendiyse, belki sadece butonu aktif bırakıp wrapper'ı gizlemeyebiliriz?
        // Veya hata mesajı gösterebiliriz. Şimdilik gizleyelim.
        wrapper.style.display = 'none';
        button.textContent = "🎤 Dinle"; // Buton metnini geri al
        button.disabled = false;       // Butonu tekrar aktif yap
    });

    video.onended = () => {
      wrapper.classList.add("fade-out"); // Video bitince solma efekti ekle
      button.textContent = "🎤 Dinle";
      button.disabled = false;

      // Solma animasyonu bitince display:none yap
      setTimeout(() => {
          // Hâlâ fade-out sınıfı varsa gizle (başka bir işlem araya girmemişse)
          if (wrapper.classList.contains('fade-out')) {
             wrapper.style.display = "none";
             wrapper.classList.remove("fade-out"); // Bir sonraki gösterim için sınıfı temizle
          }
      }, 1500); // CSS'deki animasyon süresiyle uyumlu olmalı
    };
  } else {
      console.error("Video, wrapper veya playButton bulunamadı!");
      if(wrapper) wrapper.style.display = 'none'; // Bulunamayan eleman varsa alanı gizle
  }
}


// Sayfa kapanmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
  saveCurrentConversation();
});
