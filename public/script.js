// script.js - GÜNCELLENMİŞ HALİ (Dinamik Sol Ok, Görsel Buton + Düzeltilmiş Avatar Video)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton; // Yeni gönderme oku
let gorselButton; // Görsel oluştur butonu
let videoWrapper, introVideo, playButton; // Video elementleri

// Görsel üretim için backend URL'si 
const BACKEND_URL = "https://sibelgpt-backend.onrender.com"; 

// ✅ Sadece görsel butonuna tıklandığında çağrılacak görsel üretim işlevi
async function handleGenerateImageClick() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen görsel için bir açıklama yazın."); 
        return; 
    }

    appendMessage("SibelGPT", " Görüntü isteğiniz işleniyor, lütfen bekleyin...", "bot", false); 
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
        
        // "İşleniyor" mesajını sil (eğer varsa)
        const thinkingMessage = chatBox.querySelector('.bot-message:last-child');
         if (thinkingMessage && thinkingMessage.textContent.includes('Görüntü isteğiniz işleniyor...')) {
            thinkingMessage.remove();
        }

        if (data.image_url) {
            const gorselHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <img src="${data.image_url}" alt="Üretilen Görsel" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;" />
                    <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #8e24aa; color: white; cursor: pointer;">
                    📥 İndir
                    </button>
                </div>
            `;
            appendMessage("Sen", prompt, "user", true); 
            appendMessage("SibelGPT", gorselHTML, "bot", true); 
        } else {
            appendMessage("Sen", prompt + " (Görsel denemesi)", "user", true); 
            appendMessage("SibelGPT", "❗ Görsel üretilemedi: " + (data.error || 'Bilinmeyen bir sunucu hatası oluştu.'), "bot", true);
        }
    } catch (e) {
        console.error("Görsel buton hatası:", e);
        appendMessage("Sen", prompt + " (Görsel denemesi)", "user", true); 
        appendMessage("SibelGPT", "⚠️ Görsel üretme servisine bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    }
}


// Ana mesaj gönderme fonksiyonu (Sohbet için)
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user", true);
  userInput.value = ""; 
  if (sendArrowButton) { 
      sendArrowButton.classList.remove('visible');
  }

  try {
    appendMessage("SibelGPT", " yanıt hazırlanıyor...", "bot", false); 

    const response = await fetch(`${BACKEND_URL}/chat`, { 
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });
    
    // "Hazırlanıyor" mesajını sil
    const thinkingMessage = chatBox.querySelector('.bot-message:last-child');
     if (thinkingMessage && thinkingMessage.textContent.includes('yanıt hazırlanıyor...')) {
        thinkingMessage.remove();
    }

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot", true); 

  } catch (error) {
     // "Hazırlanıyor" mesajını sil (hata durumunda da)
     const thinkingMessage = chatBox.querySelector('.bot-message:last-child');
     if (thinkingMessage && thinkingMessage.textContent.includes('yanıt hazırlanıyor...')) {
          thinkingMessage.remove();
     }
     appendMessage("SibelGPT", "❌ Bir sunucu hatası oluştu veya sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    console.error("Mesaj gönderirken hata:", error);
  }
}

// Mesajı ekrana ve geçmişe ekler
function appendMessage(sender, text, role, addToHistory = false) {
  if(!chatBox) return; // Chatbox yoksa ekleme yapma

  const messageElem = document.createElement("div");
  messageElem.classList.add("message");
  messageElem.classList.add(role + "-message"); 
  messageElem.innerHTML = `<strong>${sender}:</strong> `; // Önce göndereni ekle
  
  // Metin içeriğini güvenli bir şekilde ekle (HTML'e izin verme)
  const textNode = document.createTextNode(text);
  // Eğer text HTML ise (görsel gibi), innerHTML kullanmamız lazım. 
  // Basit bir kontrol yapalım:
  if (text.trim().startsWith('<div')) { // Görsel HTML'i ise
       messageElem.innerHTML += text; // Direkt HTML olarak ekle
  } else {
       messageElem.appendChild(textNode); // Normal metin olarak ekle
  }

  chatBox.appendChild(messageElem);

  if (addToHistory && currentConversation) { 
    // Görsel HTML'ini geçmişe kaydetmeyelim, sadece prompt kalsın diye kontrol edebiliriz.
    // Şimdilik olduğu gibi kaydediyoruz.
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
  if (!currentConversation || currentConversation.length <= 1) return; // Boş veya sadece başlangıç mesajıysa kaydetme
  
  const chatId = Date.now(); 
  const title = generateConversationTitle(currentConversation);
  const conversations = loadConversations();
  conversations.unshift({ id: chatId, title: title, messages: currentConversation }); 
  saveConversations(conversations);
  // displayHistory(); // Kaydettikten sonra listeyi hemen güncellemeye gerek yok, yeni sohbete geçince güncellenir.
}

// Sohbet için başlık oluştur
function generateConversationTitle(conversation) {
  const firstUserMessage = conversation.find(msg => msg.role === 'user');
  if (firstUserMessage?.text) {
    const text = firstUserMessage.text.trim();
    // Görsel promptlarını başlık yapma (isteğe bağlı)
    if (text.toLowerCase().includes("görsel") || text.toLowerCase().includes("çiz")) {
        return "Görsel Sohbeti";
    }
    return text.length > 35 ? text.substring(0, text.lastIndexOf(' ', 35) || 35) + '...' : text;
  }
  return "Yeni Sohbet Başlığı"; 
}

// Sohbeti temizle
function clearChat() {
  if(!chatBox) return;
  chatBox.innerHTML = ''; 
  const initialBotMessageHTML = `<strong>SibelGPT:</strong> Merhaba! SibelGPT, Sibel Kazan Midilli tarafından geliştirilen yapay zeka destekli bir dijital danışmandır. Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın!`;
  
  const initialBotMessageElem = document.createElement("div");
  initialBotMessageElem.classList.add("message", "bot-message");
  initialBotMessageElem.innerHTML = initialBotMessageHTML;
  chatBox.appendChild(initialBotMessageElem);

  currentConversation = [{ 
      sender: 'SibelGPT',
      text: initialBotMessageHTML.replace(/<strong>.*?<\/strong>/g, '').trim(), // HTML'i temizle
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
      listItem.textContent = conv.title || "Adsız Sohbet"; 
      listItem.setAttribute('data-chat-id', conv.id);
      
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
    // Önce ekranı temizle ve sadece başlangıç mesajını koy
    clearChat(); 
    // currentConversation'ı sıfırla (clearChat zaten başlangıç mesajını ekliyor)
    currentConversation = [{ 
        sender: 'SibelGPT',
        text: chatBox.querySelector('.bot-message').textContent.replace('SibelGPT:', '').trim(),
        role: 'bot'
    }];

    // Başlangıç mesajı hariç diğer mesajları ekrana bas
    conversationToLoad.messages.forEach((msg, index) => {
       if (index > 0) { // İlk mesajı (başlangıç mesajı) atla
           appendMessage(msg.sender, msg.text, msg.role, false); 
       }
    });
    // currentConversation'ı yüklenen sohbetle tam olarak güncelle
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
       // Eğer silme butonuna tıklandıysa yükleme yapma
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
    displayHistory(); // Listeyi hemen güncelle
    
    // Eğer silinen sohbet o an ekranda yüklü ise, yeni sohbet ekranına geç
    const isActiveConversation = currentConversation && currentConversation.length > 0 && conversations.find(c => c.id == chatId) === undefined;
    // VEYA basitçe kontrol et: eğer seçili li yoksa veya silinen seçiliyse
    const selectedLi = historyList ? historyList.querySelector('.selected') : null;
     if (!selectedLi || selectedLi.getAttribute('data-chat-id') == chatId) {
         handleNewChat(); // Yeni sohbet başlat
     }
}


// Yeni sohbet butonu işlevi
function handleNewChat() {
  saveCurrentConversation(); 
  clearChat(); 
  displayHistory(); // Yeni sohbetten sonra geçmişi yenile (seçili olmasın)
  if(userInput) userInput.focus(); 
}


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
  videoWrapper = document.getElementById('video-wrapper'); // Video wrapper'ı seç
  introVideo = document.getElementById('intro-video');     // Videoyu seç
  playButton = document.getElementById('play-button');     // Oynat butonunu seç


  // Splash ekranını yönet
  if (splashScreen) {
      splashScreen.addEventListener('animationend', (event) => {
          if (event.target.classList.contains('splash-logo')) { 
              splashScreen.style.opacity = 0;
              setTimeout(() => {
                  splashScreen.style.display = "none";
                  if(mainInterface) mainInterface.style.display = "flex";
                  initializeChatInterface(); 
                  
                  // *** DÜZELTME: Video Wrapper'ı (ve içindeki butonu) görünür yap ***
                  if (videoWrapper) {
                      videoWrapper.style.display = "flex"; // Wrapper'ı göster
                      // Videoyu başlangıçta gizle (CSS'de de yapılabilir ama JS'de garanti olsun)
                      // if(introVideo) introVideo.style.display = 'none'; 
                      // NOT: CSS'de display:none eklemediysek video direkt görünebilir.
                      // Şimdilik CSS'e güvenelim veya aşağıdaki playIntroVideo'da gizleyelim.
                  }
                  // *** DÜZELTME SONU ***

              }, 500); 
          }
      });
  } else {
       if(mainInterface) mainInterface.style.display = "flex";
       initializeChatInterface();
       // *** DÜZELTME: Splash yoksa da Video Wrapper'ı göster ***
       if (videoWrapper) {
           videoWrapper.style.display = "flex";
           // if(introVideo) introVideo.style.display = 'none'; 
       }
       // *** DÜZELTME SONU ***
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
   if (playButton) { // Oynat butonuna tıklama olayı ekle
       playButton.addEventListener('click', playIntroVideo);
   }


  // Başlangıç mesajını currentConversation'a ekle
  clearChat(); // Başlangıçta ekranı temizleyip ilk mesajı koysun ve currentConversation'ı ayarlasın.


  // Sayfa ilk yüklendiğinde input'a odaklan
  setTimeout(() => { 
      if(userInput) userInput.focus(); 
  }, 600); // Splash animasyonu bittikten sonra odaklanması için süreyi biraz artır
});

// Ana arayüz başlatıldığında çağrılır
function initializeChatInterface() {
  displayHistory(); 
}

// Avatar videosunu oynat
function playIntroVideo() {
  // Elementlerin tekrar seçildiğinden emin ol (veya global değişkenleri kullan)
  const video = introVideo || document.getElementById("intro-video");
  const wrapper = videoWrapper || document.getElementById("video-wrapper");
  const button = playButton || document.getElementById("play-button");

  if (video && wrapper && button) {
    // Videoyu görünür yapmadan önce wrapper'ın görünür olduğundan emin ol
    wrapper.style.display = "flex"; 
    wrapper.classList.remove("fade-out"); 
    
    // *** DÜZELTME: Videonun kendisini de görünür yap ***
    video.style.display = 'block'; // Veya 'inline', 'inline-block' vb. duruma göre
    // *** DÜZELTME SONU ***

    video.muted = false; 
    video.currentTime = 0;
    
    video.play().then(() => {
        button.textContent = "🔊 Oynatılıyor..."; // Buton metnini değiştir
        button.disabled = true; // Oynarken tekrar basılmasın
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı:", e);
        wrapper.style.display = 'none'; 
    });

    // Video bitince
    video.onended = () => {
      wrapper.classList.add("fade-out");
      button.textContent = "🎤 Dinle"; // Buton metnini geri al
      button.disabled = false; // Butonu tekrar aktif et
      
      setTimeout(() => {
          if (wrapper.classList.contains('fade-out')) { 
             // *** DÜZELTME: Sadece wrapper'ı değil videoyu da gizle ***
             wrapper.style.display = "none"; 
             video.style.display = 'none';
             // *** DÜZELTME SONU ***
             wrapper.classList.remove("fade-out"); 
          }
      }, 1500); 
    };
  } else {
      console.error("Video veya kontrol elemanları bulunamadı!");
  }
}


// Sayfa kapanmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
  saveCurrentConversation();
});
