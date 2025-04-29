// script.js - GÜNCELLENMİŞ HALİ (Dinamik Sol Ok ve Görsel Buton İşlevli)

// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

let currentConversation = [];
let chatBox, userInput, newChatButton, historyList, splashScreen, mainInterface;
let sendArrowButton; // Yeni gönderme oku
let gorselButton; // Görsel oluştur butonu

// Görsel üretim için backend URL'si (Render uygulamanızın adresi)
// ÖNEMLİ: Buradaki adresi kendi Render uygulamanızın adresiyle değiştirmeniz gerekebilir.
const BACKEND_URL = "https://sibelgpt-backend.onrender.com"; 

// ✅ Sadece görsel butonuna tıklandığında çağrılacak görsel üretim işlevi
async function handleGenerateImageClick() {
    const prompt = userInput.value.trim();
    if (!prompt) {
        alert("Lütfen görsel için bir açıklama yazın."); // Kullanıcıyı uyar
        return; 
    }

    // Kullanıcıya isteğin alındığını belirtelim (isteğe bağlı)
    appendMessage("SibelGPT", " Görüntü isteğiniz işleniyor, lütfen bekleyin...", "bot", false); 
    // Input'u hemen temizleyelim ve oku gizleyelim
    userInput.value = ""; 
    if (sendArrowButton) {
        sendArrowButton.classList.remove('visible');
    }

    try {
        const res = await fetch(`${BACKEND_URL}/image`, { // /image endpoint'ini kullan
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: prompt })
        });
        const data = await res.json();
        
        // "İşleniyor" mesajını silmek yerine direkt sonucu ekleyelim
        
        if (data.image_url) {
            const gorselHTML = `
                <div style="display: flex; flex-direction: column; align-items: flex-start;">
                    <img src="${data.image_url}" alt="Üretilen Görsel" style="max-width: 100%; max-height: 400px; object-fit: contain; border-radius: 8px; margin-bottom: 8px;" />
                    <button onclick="indirGorsel('${data.image_url}')" style="padding: 6px 12px; font-size: 14px; border: none; border-radius: 4px; background-color: #8e24aa; color: white; cursor: pointer;">
                    📥 İndir
                    </button>
                </div>
            `;
            // Promptu da geçmişe ekleyelim ki ne için üretildiği belli olsun
            appendMessage("Sen", prompt, "user", true); 
            appendMessage("SibelGPT", gorselHTML, "bot", true); 
        } else {
            // Başarısızlık mesajını da geçmişe ekle
            appendMessage("Sen", prompt + " (Görsel denemesi)", "user", true); 
            appendMessage("SibelGPT", "❗ Görsel üretilemedi: " + (data.error || 'Bilinmeyen bir sunucu hatası oluştu.'), "bot", true);
        }
    } catch (e) {
        console.error("Görsel buton hatası:", e);
         // Başarısızlık mesajını da geçmişe ekle
        appendMessage("Sen", prompt + " (Görsel denemesi)", "user", true); 
        appendMessage("SibelGPT", "⚠️ Görsel üretme servisine bağlanırken bir hata oluştu. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    }
}


// Ana mesaj gönderme fonksiyonu (Sohbet için)
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("Sen", message, "user", true);
  userInput.value = ""; // Input'u temizle
  if (sendArrowButton) { // Oku gizle
      sendArrowButton.classList.remove('visible');
  }

  // GÖRSEL ÜRETİM KONTROLÜ (İsteğe Bağlı - Enter ile de tetiklenebilir)
  // Eğer kullanıcı "çiz", "görsel" gibi anahtar kelimelerle mesaj gönderirse
  // doğrudan görsel üretimi de tetikleyebiliriz (isteğe bağlı)
  // const gorselHTML = await istekGorselIseYonet(message); 
  // if (gorselHTML !== null) {
  //   appendMessage("SibelGPT", gorselHTML, "bot", true);
  //   return; 
  // }
  // Şimdilik yukarıdaki kısmı yorumda bırakalım, sadece butonla tetiklensin.

  // Normal sohbet isteği
  try {
    // Kullanıcıya beklediğini belirtelim (isteğe bağlı)
    appendMessage("SibelGPT", " yanıt hazırlanıyor...", "bot", false); // Geçmişe ekleme

    const response = await fetch(`${BACKEND_URL}/chat`, { // /chat endpoint'ini kullan
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    // "Hazırlanıyor" mesajını silmek yerine direkt sonucu ekleyelim
    // TODO: İstenirse önceki mesajı silme kodu eklenebilir

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";
    appendMessage("SibelGPT", reply, "bot", true); // Cevabı geçmişe ekle

  } catch (error) {
     // Hata mesajını geçmişe ekle
    appendMessage("SibelGPT", "❌ Bir sunucu hatası oluştu veya sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin veya daha sonra tekrar deneyin.", "bot", true);
    console.error("Mesaj gönderirken hata:", error);
  }
}

// Mesajı ekrana ve geçmişe ekler
function appendMessage(sender, text, role, addToHistory = false) {
  const messageElem = document.createElement("div");
  // messageElem.className = "message " + role + "-message"; // Sınıf adını düzeltelim
  messageElem.classList.add("message");
  messageElem.classList.add(role + "-message"); // Doğru sınıf ekleme

  // Güvenlik için text'i doğrudan innerHTML'e vermek yerine 
  // önce text node oluşturup sonra strong eklemek daha iyi olabilir
  // Ama şimdilik basit tutalım, backend'den gelen yanıta güveniyoruz.
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`; 
  
  // "yanıt hazırlanıyor..." mesajını silelim (eğer varsa)
  const thinkingMessage = chatBox.querySelector('.bot-message:last-child');
  if (thinkingMessage && thinkingMessage.textContent.includes('yanıt hazırlanıyor...')) {
      thinkingMessage.remove();
  }
   if (thinkingMessage && thinkingMessage.textContent.includes('Görüntü isteğiniz işleniyor...')) {
      thinkingMessage.remove();
  }


  chatBox.appendChild(messageElem);

  if (addToHistory && currentConversation) { // currentConversation tanımlı mı kontrol et
    currentConversation.push({ sender, text, role });
  }

  // Kaydırmayı en sona getir (küçük bir gecikmeyle)
  setTimeout(() => {
    if(chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, 100);
}

// Görsel indirme fonksiyonu
function indirGorsel(url) {
  // Doğrudan yeni sekmede açmak genellikle daha sorunsuz çalışır
  window.open(url, '_blank'); 
  
  // Alternatif: İndirme linki oluşturma (bazen tarayıcı engeller)
  /*
  const link = document.createElement('a');
  link.href = url;
  // Tarayıcının indirmesi için 'download' attribute'u önemlidir ama her zaman çalışmaz.
  // Güvenlik nedeniyle tarayıcılar farklı origin'den gelen URL'leri doğrudan indirmeyi engelleyebilir.
  link.download = 'sibelgpt-gorsel.png'; // İndirilen dosya adı
  link.target = '_blank'; // Yeni sekmede açmayı dene (indirme başarısız olursa)
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  */
}

// Enter tuşuna basılınca mesaj gönder
function handleInputKeyPress(event) {
  if (event.key === 'Enter' && !event.shiftKey) { // Shift+Enter yeni satır yapar
    event.preventDefault(); // Enter'ın varsayılan yeni satır davranışını engelle
    if(userInput.value.trim() !== '') { // Sadece input doluysa gönder
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
    localStorage.removeItem(HISTORY_STORAGE_KEY); // Bozuk veriyi temizle
    return [];
  }
}

// Sohbet geçmişini Local Storage'a kaydet
function saveConversations(conversations) {
  try {
    // Geçmişi belli bir sayıyla sınırla (örn: son 50 sohbet)
    const MAX_HISTORY = 50;
    if (conversations.length > MAX_HISTORY) {
      conversations = conversations.slice(0, MAX_HISTORY);
    }
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
  } catch (e) {
    console.error("Sohbet geçmişi kaydedilirken hata:", e);
     // Eğer kaydetme hatası genellikle boyut limitinden olur, en eskiyi silmeyi deneyebiliriz
     if (e.name === 'QuotaExceededError' && conversations.length > 0) {
         console.warn("Depolama alanı dolu, en eski sohbet siliniyor.");
         saveConversations(conversations.slice(0, conversations.length - 1));
     }
  }
}

// Mevcut sohbeti kaydet (eğer anlamlıysa)
function saveCurrentConversation() {
  // Başlangıç mesajını veya boş sohbeti kaydetme
  if (!currentConversation || currentConversation.length === 0) return;
  if (currentConversation.length === 1 && currentConversation[0].role === 'bot' && currentConversation[0].text.includes('Merhaba!')) return;
  
  const chatId = Date.now(); // Basit bir ID
  const title = generateConversationTitle(currentConversation);
  const conversations = loadConversations();

  // Eğer aynı sohbet zaten varsa üzerine yazma, yenisini ekle (ya da güncelle?)
  // Şimdilik hep yeni ekliyoruz.
  conversations.unshift({ id: chatId, title: title, messages: currentConversation }); 
  
  saveConversations(conversations);
  displayHistory(); // Geçmiş listesini güncelle
}

// Sohbet için başlık oluştur
function generateConversationTitle(conversation) {
  const firstUserMessage = conversation.find(msg => msg.role === 'user');
  if (firstUserMessage?.text) {
    const text = firstUserMessage.text.trim();
    // Başlığı makul bir uzunlukta tut
    return text.length > 35 ? text.substring(0, text.lastIndexOf(' ', 35) || 35) + '...' : text;
  }
  return "Yeni Sohbet Başlığı"; // Varsayılan başlık
}

// Sohbeti temizle
function clearChat() {
  if(chatBox) chatBox.innerHTML = ''; // Sadece başlangıç mesajını ekleyelim mi?
  // Başlangıç mesajını tekrar ekle:
   const initialBotMessageElem = document.createElement("div");
   initialBotMessageElem.classList.add("message", "bot-message");
   initialBotMessageElem.innerHTML = `<strong>SibelGPT:</strong> Merhaba! SibelGPT, Sibel Kazan Midilli tarafından geliştirilen yapay zeka destekli bir dijital danışmandır. Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın!`;
   if(chatBox) chatBox.appendChild(initialBotMessageElem);

  currentConversation = []; // Mevcut sohbeti sıfırla
   if (initialBotMessageElem.textContent) {
       currentConversation.push({ // Başlangıç mesajını da diziye ekle
           sender: 'SibelGPT',
           text: initialBotMessageElem.textContent.replace('SibelGPT:', '').trim(),
           role: 'bot'
       });
   }

  highlightSelectedChat(null); // Seçili sohbet vurgusunu kaldır
  if(userInput) userInput.value = ""; // Input'u temizle
  if(sendArrowButton) sendArrowButton.classList.remove('visible'); // Oku gizle
}

// Geçmiş sohbetleri kenar çubuğunda göster
function displayHistory() {
  if(!historyList) return; // Eğer historyList yoksa çık
  
  const conversations = loadConversations();
  historyList.innerHTML = ''; // Listeyi temizle

  if (conversations.length === 0) {
    const placeholder = document.createElement('li');
    placeholder.textContent = 'Henüz kaydedilmiş sohbet yok.';
    placeholder.style.cursor = 'default';
    placeholder.style.opacity = '0.7';
    historyList.appendChild(placeholder);
  } else {
    conversations.forEach(conv => {
      const listItem = document.createElement('li');
      listItem.textContent = conv.title || "Adsız Sohbet"; // Başlık yoksa varsayılan
      listItem.setAttribute('data-chat-id', conv.id);
      // Silme butonu ekleyelim (isteğe bağlı)
      const deleteButton = document.createElement('span');
      deleteButton.textContent = '🗑️';
      deleteButton.style.float = 'right';
      deleteButton.style.cursor = 'pointer';
      deleteButton.style.marginLeft = '10px';
      deleteButton.style.visibility = 'hidden'; // Normalde gizli
      deleteButton.onclick = (e) => {
          e.stopPropagation(); // li'ye tıklamayı engelle
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
  saveCurrentConversation(); // Önce mevcut sohbeti kaydet
  const conversations = loadConversations();
  const conversationToLoad = conversations.find(conv => conv.id == chatId); // == ile tip karşılaştırması yapmadan
  
  if (conversationToLoad) {
    clearChat(); // Önce ekranı temizle ama başlangıç mesajını koy
    currentConversation = []; // Geçmişi sıfırla
    
    // Başlangıç mesajı hariç diğer mesajları yükle
    conversationToLoad.messages.forEach((msg, index) => {
       // İlk bot mesajı genellikle standart karşılama mesajıdır, onu tekrar eklemeyelim
       // (clearChat zaten ekliyor)
       // if (index === 0 && msg.role === 'bot' && msg.text.includes('Merhaba!')) {
       //     currentConversation.push(msg); // Diziye ekle ama ekrana basma
       //     return;
       // }
       appendMessage(msg.sender, msg.text, msg.role, false); // Ekrana bas, geçmişe ekleme (zaten yüklü)
    });
    // currentConversation'ı yüklenen sohbetle güncelle
    currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages)); 
    
    highlightSelectedChat(chatId); // Kenar çubuğunda vurgula
    if(userInput) userInput.focus(); // Input'a odaklan
  } else {
      console.error("Sohbet bulunamadı:", chatId);
      // Kullanıcıya bilgi verilebilir
  }
}

// Geçmiş listesinden bir sohbete tıklandığında
function handleHistoryClick(event) {
  const clickedElement = event.target;
  // Eğer tıklanan yer li ise veya li içindeki span (başlık) ise
  if (clickedElement.tagName === 'LI' || clickedElement.closest('li')) {
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
    // Eğer silinen sohbet o an açıksa, yeni sohbet ekranına geç
    const currentSelected = historyList.querySelector('.selected');
    if (!currentSelected || (currentSelected && currentSelected.getAttribute('data-chat-id') == chatId)) {
        handleNewChat();
    }
}


// Yeni sohbet butonu işlevi
function handleNewChat() {
  saveCurrentConversation(); // Mevcut sohbeti kaydet
  clearChat(); // Ekranı temizle ve başlangıç mesajını koy
  if(userInput) userInput.focus(); // Input'a odaklan
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
  sendArrowButton = document.getElementById('send-arrow-button'); // Yeni oku seç
  gorselButton = document.getElementById('gorsel-buton'); // Görsel butonunu seç

  // Splash ekranını yönet
  if (splashScreen) {
      splashScreen.addEventListener('animationend', (event) => {
          // Sadece splash-logo animasyonu bittiğinde çalışsın
          if (event.target.classList.contains('splash-logo')) { 
              splashScreen.style.opacity = 0;
              setTimeout(() => {
                  splashScreen.style.display = "none";
                  if(mainInterface) mainInterface.style.display = "flex";
                  initializeChatInterface(); // Ana arayüz görünür olduktan sonra başlat
                  // Avatar videosunu göster (eğer varsa)
                  const wrapper = document.getElementById("video-wrapper");
                  // Wrapper'ı hemen göstermek yerine belki bir butona basınca göster?
                  // Şimdilik direkt gösterelim
                  // if (wrapper) wrapper.style.display = "flex"; 
                  // NOT: Video otomatik başlamasın, kullanıcı butona bassın.
              }, 500); // opacity geçişi için biraz bekle
          }
      });
  } else {
       // Splash yoksa direkt arayüzü göster ve başlat
       if(mainInterface) mainInterface.style.display = "flex";
       initializeChatInterface();
       // const wrapper = document.getElementById("video-wrapper");
       // if (wrapper) wrapper.style.display = "flex";
  }


  // Olay dinleyicilerini ekle
  if (userInput) {
      userInput.addEventListener("keypress", handleInputKeyPress);
      // Input alanına yazı yazıldığında oku göster/gizle
      userInput.addEventListener('input', () => {
          if (sendArrowButton) { // Eğer ok butonu varsa
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
  if (sendArrowButton) { // Yeni ok için tıklama olayı
      sendArrowButton.addEventListener('click', sendMessage);
  }
  if (gorselButton) { // Görsel butonu için tıklama olayı
      gorselButton.addEventListener('click', handleGenerateImageClick);
  }

  // Başlangıç mesajını currentConversation'a ekle (varsa)
  const initialBotMessageElement = chatBox ? chatBox.querySelector('.bot-message') : null;
  if (initialBotMessageElement && initialBotMessageElement.textContent) {
      currentConversation = [{ // currentConversation'ı başlat
          sender: 'SibelGPT',
          text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(),
          role: 'bot'
      }];
  } else {
       currentConversation = []; // Başlangıç mesajı yoksa boş dizi
  }

  // Sayfa ilk yüklendiğinde input'a odaklan (küçük gecikmeyle)
  setTimeout(() => { 
      if(userInput) userInput.focus(); 
  }, 100); 
});

// Ana arayüz başlatıldığında çağrılır
function initializeChatInterface() {
  displayHistory(); // Geçmişi yükle ve göster
}

// Avatar videosunu oynat (Dinle butonuna bağlı)
function playIntroVideo() {
  const video = document.getElementById("intro-video");
  const wrapper = document.getElementById("video-wrapper");
  const playButton = document.getElementById("play-button"); // Butonu da seçelim

  if (video && wrapper && playButton) {
    video.muted = false; 
    video.currentTime = 0;
    wrapper.style.display = "flex"; // Wrapper'ı görünür yap
    wrapper.classList.remove("fade-out"); // Varsa fade-out animasyonunu kaldır
    
    video.play().then(() => {
        // Oynatma başarılı olursa butonu gizle veya değiştir?
        // playButton.style.display = 'none'; // Örneğin gizle
    }).catch(e => {
        console.warn("Video otomatik oynatılamadı:", e);
        // Belki kullanıcıya bir mesaj gösterilir?
        wrapper.style.display = 'none'; // Hata olursa wrapper'ı gizle
    });

    // Video bitince veya durunca ne olacağı
    video.onended = () => {
      wrapper.classList.add("fade-out");
      // playButton.style.display = 'block'; // Video bitince butonu tekrar göster
      // Fade out animasyonu bitince display:none yapalım
      setTimeout(() => {
          if (wrapper.classList.contains('fade-out')) { // Hala fade-out ise gizle
             wrapper.style.display = "none";
             wrapper.classList.remove("fade-out"); // Sınıfı temizle
          }
      }, 1500); // Animasyon süresi kadar bekle
    };
     // Video oynarken üzerine tıklayınca durdur ve gizle (isteğe bağlı)
     /*
     video.onclick = () => {
         video.pause();
         wrapper.classList.add("fade-out");
         setTimeout(() => {
             wrapper.style.display = "none";
             wrapper.classList.remove("fade-out");
         }, 1500);
     };
     */
  }
}


// Sayfa kapanmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
  saveCurrentConversation();
});
