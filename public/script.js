// script.js - GÜNCELLENMİŞ HALİ (İnternet Arama Butonu Eklendi)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton;
let gorselButton;
let searchButton; // === YENİ BUTON DEĞİŞKENİ ===
let videoWrapper, introVideo, playButton;
let loadingMessageElement = null; // Yükleniyor mesajını takip etmek için

const BACKEND_URL = "https://sibelgpt-backend.onrender.com";

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

// === YENİ İNTERNET ARAMA BUTONU TIKLAMA İŞLEVİ (ŞİMDİLİK BOŞ) ===
async function handleInternetSearchClick() {
    const prompt = userInput?.value?.trim(); // Girdiyi al (null kontrolü)
    console.log('İnternet Araması butonu tıklandı!');
    alert('İnternet arama özelliği yakında eklenecektir. Backend bağlantısı bekleniyor.');

    // TODO: Backend'e Serper API isteği gönderecek kod buraya gelecek.
    // Bu fonksiyon backend entegrasyonu yapıldığında güncellenecek.
}
// =============================================================

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
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
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

    messageElem.innerHTML = `<strong>${sender}:</strong> `;

    if (typeof text === 'string' && text.trim().startsWith('<div')) {
        const contentDiv = document.createElement('div');
        contentDiv.innerHTML = text;
         while (contentDiv.firstChild) {
             messageElem.appendChild(contentDiv.firstChild);
         }
    } else if (typeof text === 'string') {
         const textNode = document.createTextNode(text);
         messageElem.appendChild(textNode);
    } else {
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
        let historyText = text;
        if (typeof text === 'string' && text.includes('<img')) {
            historyText = "[Üretilen Görsel]";
        } else if (typeof text === 'string' && text.includes('<')) {
             const tempDiv = document.createElement('div');
             tempDiv.innerHTML = text;
             historyText = tempDiv.textContent || tempDiv.innerText || "[Karmaşık İçerik]";
        }
        currentConversation.push({ sender, text: historyText, role });
    }

    setTimeout(() => {
        if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
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

// -------- History, Conversation, Clear vb. Fonksiyonlar (Değişiklik Yok - önceki script.js'ten alındı) --------
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
    // En yeni sohbetler başa eklendiği için, sondan değil baştan keselim
    if (conversations.length > MAX_HISTORY) {
      conversations = conversations.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Sohbet geçmişi kaydedilirken hata:", e);
     if (e.name === 'QuotaExceededError' && conversations.length > 0) {
         console.warn("Depolama alanı dolu, en eski sohbet siliniyor.");
         // En sondaki (en eski) sohbeti sil
         saveConversations(conversations.slice(0, conversations.length - 1));
     }
  }
}
// Mevcut sohbeti kaydet (eğer anlamlıysa)
function saveCurrentConversation() {
  // İlk mesaj (bot mesajı) hariç kullanıcıdan veya bottan mesaj varsa kaydet
  if (!currentConversation || currentConversation.length <= 1) return;

  // Sohbetin ID'sini ilk mesajdan alalım (varsa)
  const chatId = currentConversation[0]?.chatId || Date.now(); // Varsa kullan, yoksa yeni oluştur

  const title = generateConversationTitle(currentConversation);
  let conversations = loadConversations();

  // Bu ID ile kayıtlı bir sohbet zaten var mı diye kontrol et
  const existingIndex = conversations.findIndex(c => c.id === chatId);

  const conversationData = {
      id: chatId,
      title: title,
      messages: JSON.parse(JSON.stringify(currentConversation)), // Derin kopya alalım
      lastUpdated: Date.now() // Son güncellenme zamanı
  };

  if (existingIndex > -1) {
      // Varsa, güncelle
      conversations[existingIndex] = conversationData;
      console.log("Sohbet güncellendi:", chatId);
  } else {
      // Yoksa, yeni olarak başa ekle
      conversations.unshift(conversationData);
      console.log("Yeni sohbet kaydedildi:", chatId);
  }

  // Tarihe göre sırala (en yeni üstte)
  conversations.sort((a, b) => (b.lastUpdated || b.id) - (a.lastUpdated || a.id));

  saveConversations(conversations);
}

// Sohbet için başlık oluştur
function generateConversationTitle(conversation) {
  const firstUserMessage = conversation.find(msg => msg.role === 'user');
  if (firstUserMessage?.text) {
    const text = String(firstUserMessage.text).trim();
    if (text.toLowerCase().includes("görsel") || text.toLowerCase().includes("çiz") || text === "[Üretilen Görsel]") {
        return "🖼️ Görsel Sohbeti";
    }
     const tempDiv = document.createElement('div');
     tempDiv.innerHTML = text;
     const cleanText = tempDiv.textContent || tempDiv.innerText || "";

    return cleanText.length > 35 ? cleanText.substring(0, cleanText.lastIndexOf(' ', 35) || 35) + '...' : (cleanText || "Yeni Sohbet");
  }
  // Eğer kullanıcı mesajı yoksa (sadece başlangıç mesajı varsa) veya text yoksa
  const firstBotMessage = conversation.find(msg => msg.role === 'bot');
  if (firstBotMessage?.text?.includes("Merhaba")) {
      return "💬 Yeni Sohbet";
  }
  return "Adsız Sohbet"; // Genel yedek başlık
}
// Sohbeti temizle
function clearChat() {
  if(!chatBox) return;
  chatBox.innerHTML = '';
  // Orijinal script'teki başlangıç mesajını kullanalım [cite: 1]
  const initialBotMessageHTML = `<strong>SibelGPT:</strong> Merhaba! SibelGPT, Sibel Kazan Midilli tarafından geliştirilen yapay zeka destekli bir dijital danışmandır. Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın!`;
  const initialBotMessageElem = document.createElement("div");
  initialBotMessageElem.classList.add("message", "bot-message");
  initialBotMessageElem.innerHTML = initialBotMessageHTML;
  chatBox.appendChild(initialBotMessageElem);
  currentConversation = [{
      sender: 'SibelGPT',
      text: initialBotMessageHTML.replace(/<strong>.*?<\/strong>/g, '').trim(),
      role: 'bot',
      chatId: Date.now() // Yeni sohbet için yeni ID ata
  }];
  highlightSelectedChat(null);
  if(userInput) userInput.value = "";
  if(sendArrowButton) sendArrowButton.classList.remove('visible');
}
// Geçmiş sohbetleri kenar çubuğunda göster
function displayHistory() {
  if(!historyList) return;
  let conversations = loadConversations();
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
      if (!conv || !conv.id) { // Geçersiz sohbet verisini atla
          console.warn("Geçersiz sohbet verisi bulundu, atlanıyor:", conv);
          return;
      }
      const listItem = document.createElement('li');
      listItem.textContent = conv.title || "Adsız Sohbet";
      listItem.setAttribute('data-chat-id', conv.id);

      const deleteButton = document.createElement('span');
      deleteButton.textContent = '🗑️';
      deleteButton.title = "Sohbeti Sil";
      // Orijinal script'teki stilleri kullanalım [cite: 1]
      deleteButton.style.float = 'right';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.marginLeft = '10px';
      deleteButton.style.visibility = 'hidden';
      // Hover için CSS class eklemek daha iyi olurdu ama şimdilik JS ile devam edelim
      deleteButton.style.opacity = '0.7';
      deleteButton.style.transition = 'opacity 0.2s ease';
      deleteButton.style.fontSize = '14px';
      deleteButton.style.padding = '0 3px';

      deleteButton.onclick = (e) => {
          e.stopPropagation();
          deleteConversation(conv.id);
      };
      // Hover stilleri
       listItem.onmouseover = () => { deleteButton.style.visibility = 'visible'; };
       listItem.onmouseout = () => { deleteButton.style.visibility = 'hidden'; };
       deleteButton.onmouseover = () => { deleteButton.style.opacity = '1'; };
       deleteButton.onmouseout = () => { deleteButton.style.opacity = '0.7'; };

      listItem.appendChild(deleteButton);
      historyList.appendChild(listItem);
    });
  }
}
// Seçili sohbeti yükle
function loadConversation(chatId) {
  // Sohbet ID'si geçerli mi diye kontrol et
  if (chatId === undefined || chatId === null || chatId === "undefined" || chatId === "null") {
      console.error("Geçersiz sohbet ID'si ile yükleme denendi:", chatId);
      handleNewChat(); // Hatalı durumda yeni sohbet başlat
      return;
  }

  saveCurrentConversation(); // Mevcut sohbeti kaydetmeyi dene (varsa)

  const conversations = loadConversations();
  const conversationToLoad = conversations.find(conv => conv && conv.id == chatId); // conv null kontrolü

  if (conversationToLoad) {
    clearChat(); // Ekranı temizle, yeni ID ile başlangıç mesajı ekler

    // clearChat yeni bir ID ürettiği için, yüklenen sohbetin ID'sini ve mesajlarını tekrar ayarlamalıyız
    currentConversation = [{ // Başlangıç mesajını tekrar oluştur ama doğru ID ile
        sender: 'SibelGPT',
        // chatBox'taki ilk mesajdan almak yerine sabit metni kullanalım, daha güvenli
        text: "Merhaba! SibelGPT, Sibel Kazan Midilli tarafından geliştirilen yapay zeka destekli bir dijital danışmandır. Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın!",
        role: 'bot',
        chatId: conversationToLoad.id // Yüklenen sohbetin ID'sini kullan
    }];
    // chatBox'taki ilk mesajı da doğru ID'li olana göre güncelleyebiliriz (opsiyonel)
    // chatBox.children[0].setAttribute('data-message-id', conversationToLoad.id + '-0');

    // Yüklenen mesajları ekle (başlangıç mesajı hariç)
    conversationToLoad.messages.forEach((msg, index) => {
       if (index > 0) { // İlk (bot) mesajı atla
           appendMessage(msg.sender, msg.text, msg.role, false); // Geçmişe ekleme (false)
       }
    });

    // currentConversation'ı yüklenen mesajlarla güncelle (derin kopya)
    currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));
    // Yüklenen sohbetin ID'sini ilk mesaja tekrar ekleyelim (tutarlılık)
    if(currentConversation[0]) {
        currentConversation[0].chatId = conversationToLoad.id;
    }

    highlightSelectedChat(chatId);
    if(userInput) userInput.focus();
  } else {
      console.error("Sohbet bulunamadı:", chatId);
      handleNewChat(); // Bulamazsa yeni sohbet başlat
  }
}
// Kenar çubuğunda seçili sohbeti vurgula
function highlightSelectedChat(chatId) {
    if (!historyList) return;
    historyList.querySelectorAll('li').forEach(li => li.classList.remove('selected'));
    if (chatId !== null && chatId !== undefined) { // null ve undefined kontrolü
        try {
            // ID'ler sayısal olduğu için seçiciyi attribute=value şeklinde kullanmak daha güvenli
            const selectedItem = historyList.querySelector(`li[data-chat-id="${chatId}"]`);
            if (selectedItem) {
                selectedItem.classList.add('selected');
            } else {
                 // Eğer listede eleman yoksa (silinmiş olabilir), vurgu yapma
                 console.warn("Vurgulanacak sohbet öğesi bulunamadı:", chatId);
            }
        } catch (e) {
            console.error("Seçili sohbet vurgulanırken hata (geçersiz ID olabilir):", chatId, e);
        }
    }
}
// Geçmiş listesinden bir sohbete tıklandığında
function handleHistoryClick(event) {
  const clickedElement = event.target;
  const listItem = clickedElement.closest('li[data-chat-id]'); // Sadece ID'si olan li'leri hedefle

  if (listItem) {
       // Doğrudan silme ikonuna mı tıklandı?
       if (clickedElement.tagName === 'SPAN' && clickedElement.textContent === '🗑️') {
           return; // Silme fonksiyonu zaten tetiklendi
       }
       const chatId = listItem.getAttribute('data-chat-id');
       if (chatId) { // ID'nin varlığını kontrol et
           loadConversation(chatId);
           if(userInput) userInput.focus();
       } else {
           console.warn("Tıklanan öğede sohbet ID'si bulunamadı.");
       }
  }
}
// Bir sohbeti silme fonksiyonu
function deleteConversation(chatId) {
    if (!confirm("Bu sohbeti silmek istediğinizden emin misiniz?")) {
        return;
    }
    let conversations = loadConversations();
    const initialLength = conversations.length;
    conversations = conversations.filter(conv => conv && conv.id != chatId); // conv null kontrolü

    if (conversations.length < initialLength) {
        saveConversations(conversations);
        displayHistory();

        // Silinen sohbet şu an ekranda açık olan mıydı?
        const currentChatId = currentConversation[0]?.chatId;
        if (currentChatId == chatId || conversations.length === 0) {
             handleNewChat(); // Evet ise veya hiç sohbet kalmadıysa yeni sohbet başlat
        } else {
             // Hayır ise, listedeki ilk sohbeti seçili yapabiliriz (isteğe bağlı)
             // veya hiçbirini seçili yapmayabiliriz. Şimdilik bir şey yapmayalım.
             highlightSelectedChat(null); // Vurguyu kaldır
        }

    } else {
        console.warn("Silinecek sohbet bulunamadı:", chatId);
    }
}
// Yeni sohbet butonu işlevi
function handleNewChat() {
  saveCurrentConversation();
  clearChat();
  // displayHistory(); // clearChat zaten history'yi yenilemeli? Tekrar çağırmaya gerek yok gibi.
                     // Ama clearChat ID ataması yaptığı için save/load döngüsünü
                     // bozabilir. displayHistory'yi burada çağırmak daha güvenli.
  displayHistory();
  highlightSelectedChat(null); // Yeni sohbette seçili öğe olmamalı
  if(userInput) userInput.focus();
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
  searchButton = document.getElementById('search-button'); // === YENİ BUTON ===
  videoWrapper = document.getElementById('video-wrapper');
  introVideo = document.getElementById('intro-video');
  playButton = document.getElementById('play-button');

  // Splash ekranını yönet
  if (splashScreen) {
      splashScreen.addEventListener('animationend', (event) => {
          // Sadece logo animasyonu bittiğinde tetikle
          if (event.animationName === 'fadeInOut' && event.target.classList.contains('splash-logo')) {
              splashScreen.style.opacity = 0;
              setTimeout(() => {
                  splashScreen.style.display = "none";
                  if(mainInterface) mainInterface.style.display = "flex"; // Ana arayüzü göster
                  // initializeChatInterface(); // Bu fonksiyon artık çok bir şey yapmıyor
                  if (videoWrapper && !localStorage.getItem('introPlayed')) {
                      videoWrapper.style.display = "flex";
                  }
                   // Başlangıçta odaklanma burada daha mantıklı olabilir
                   setTimeout(() => { if(userInput) userInput.focus(); }, 100);
              }, 500); // Opacity geçişi için bekle
          }
      });
       // Güvenlik önlemi: 5 sn sonra zorla kaldır (animasyon takılırsa diye)
       setTimeout(() => {
            if (splashScreen && splashScreen.style.display !== 'none') {
                 console.warn("Splash animasyonu takıldı, zorla kapatılıyor.");
                 splashScreen.style.opacity = 0;
                 setTimeout(() => {
                     if(splashScreen) splashScreen.style.display = "none";
                      if(mainInterface) mainInterface.style.display = "flex";
                      if (videoWrapper && !localStorage.getItem('introPlayed')) {
                          videoWrapper.style.display = "flex";
                      }
                      setTimeout(() => { if(userInput) userInput.focus(); }, 100);
                 }, 500);
            }
       }, 5000);

  } else {
       // Splash ekranı yoksa doğrudan başlat
       if(mainInterface) mainInterface.style.display = "flex";
       // initializeChatInterface();
       if (videoWrapper && !localStorage.getItem('introPlayed')) {
           videoWrapper.style.display = "flex";
       }
       setTimeout(() => { if(userInput) userInput.focus(); }, 100);
  }

  // Olay dinleyicilerini ekle (null kontrolü ile)
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
  } else { console.error("User input elementi bulunamadı!"); }

  if (newChatButton) {
      newChatButton.addEventListener("click", handleNewChat);
  } else { console.error("Yeni sohbet butonu bulunamadı!"); }

  if (historyList) {
      historyList.addEventListener("click", handleHistoryClick);
  } else { console.error("Geçmiş listesi elementi bulunamadı!"); }

  if (sendArrowButton) {
      sendArrowButton.addEventListener('click', sendMessage);
  } // Gönder oku butonu isteğe bağlı olabilir, hata vermeyelim

  if (gorselButton) {
      gorselButton.addEventListener('click', handleGenerateImageClick);
  } else { console.error("Görsel butonu bulunamadı!"); }

  // === YENİ BUTON OLAY DİNLEYİCİSİ ===
  if (searchButton) {
      searchButton.addEventListener('click', handleInternetSearchClick);
  } else { console.error("Arama butonu bulunamadı!"); }
  // =================================

   if (playButton) {
       playButton.addEventListener('click', playIntroVideo);
   } // Video butonu isteğe bağlı olabilir

   // Başlangıçta sohbeti ve geçmişi ayarla
   clearChat();
   displayHistory();
});

// Ana arayüz başlatıldığında çağrılır (Artık pek kullanılmıyor)
// function initializeChatInterface() { }

// Avatar videosunu oynat
function playIntroVideo() {
  const video = introVideo; // Global değişkeni kullan
  const wrapper = videoWrapper;
  const button = playButton;

  if (video && wrapper && button) {
    wrapper.style.display = "flex";
    wrapper.classList.remove("fade-out");

    video.muted = false;
    video.currentTime = 0;

    video.play().then(() => {
        button.textContent = "🔊 Oynatılıyor...";
        button.disabled = true;
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı, kullanıcı etkileşimi gerekebilir:", e);
        // Hata durumunda wrapper'ı gizle
        wrapper.style.display = 'none';
        button.textContent = "🎤 Dinle"; // Buton metnini geri al
        button.disabled = false;       // Butonu tekrar aktif yap
    });

    video.onended = () => {
      wrapper.classList.add("fade-out");
      button.textContent = "🎤 Dinle";
      button.disabled = false;

      setTimeout(() => {
          if (wrapper.classList.contains('fade-out')) {
             wrapper.style.display = "none";
             wrapper.classList.remove("fade-out");
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
