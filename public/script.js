// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

// Şu anki sohbetin mesajlarını tutacak dizi
let currentConversation = [];

// DOM elementlerine referanslar (sayfa yüklendiğinde atanacak)
let chatBox;
let userInput;
let newChatButton;
let historyList;
let splashScreen;
// Yeni: Animasyon video elementine referans
let talkingAvatarVideo;
// Animasyonun kapsayıcı div'ine referans (görünürlük kontrolü için)
let initialAvatarAnimationContainer;


// Yeni: Animasyonun gizlenmesi için kullanılacak timeout ID'si
let animationTimeout;


// --- Mesaj Gönderme ve Alma Fonksiyonları ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Yeni: Kullanıcı mesaj yazdığında animasyonu durdur
  stopInitialAnimation(); // stopInitialAnimation artık video elementini yönetecek

  // Kullanıcının mesajını ekle ve currentConversation'a kaydet
  appendMessage("Sen", message, "user", true); // true: geçmişe ekle
  userInput.value = ""; // Giriş alanını temizle

  try {
    // Backend API'sine mesajı gönder
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", { // URL'yi kendi Render URL'nizle değiştirin
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    // API'den gelen cevabı işle
    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";

    // Botun cevabını ekle ve currentConversation'a kaydet
    appendMessage("SibelGPT", reply, "bot", true); // true: geçmişe ekle

  } catch (error) {
    // Hata durumunda bot mesajı ekle
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot", true); // true: geçmişe ekle
    console.error("Mesaj gönderirken hata:", error);
  }
}

// Mesajı chat kutusuna ekler ve isteğe bağlı olarak geçmişe kaydeder
function appendMessage(sender, text, role, addToHistory = false) {
  const messageElem = document.createElement("div");
  messageElem.className = "message " + role;
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`;

  chatBox.appendChild(messageElem);

  if (addToHistory) {
      currentConversation.push({ sender, text, role });
  }

  setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
  }, 100);
}

// Klavyeden Enter tuşuna basıldığında mesaj gönderme
function handleInputKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}


// --- Sohbet Geçmişi Fonksiyonları (Local Storage Tabanlı) ---
// (Bu fonksiyonlarda video animasyonuyla doğrudan bir değişiklik yok)

function loadConversations() {
    const conversationsJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    try {
        return conversationsJson ? JSON.parse(conversationsJson) : [];
    } catch (e) {
        console.error("Sohbet geçmişi yüklenirken hata:", e);
        return [];
    }
}

function saveConversations(conversations) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
        console.error("Sohbet geçmişi kaydedilirken hata:", e);
    }
}

function saveCurrentConversation() {
    if (currentConversation.length <= 1) { // En az bir kullanıcı mesajı olmalı
        return;
    }

    const chatId = Date.now();
    const title = generateConversationTitle(currentConversation);

    const conversations = loadConversations();

    conversations.unshift({ id: chatId, title: title, messages: currentConversation });

    saveConversations(conversations);
    displayHistory();
}

function generateConversationTitle(conversation) {
    if (!conversation || conversation.length === 0) {
        return "Boş Sohbet";
    }
    const firstUserMessage = conversation.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.text) {
        const text = firstUserMessage.text.trim();
        if (text.length > 30) {
             const trimmedText = text.substring(0, 30);
             const lastSpaceIndex = trimmedText.lastIndexOf(' ');
             if (lastSpaceIndex > 10) {
                 return trimmedText.substring(0, lastSpaceIndex) + '...';
             }
             return trimmedText + '...';
        }
        return text;
    }
    const firstBotMessage = conversation.find(msg => msg.role === 'bot');
    if(firstBotMessage && firstBotMessage.text){
         const text = firstBotMessage.text.replace('SibelGPT:', '').trim();
          if (text.length > 30) {
             const trimmedText = text.substring(0, 30);
             const lastSpaceIndex = trimmedText.lastIndexOf(' ');
             if (lastSpaceIndex > 10) {
                 return "Bot: " + trimmedText.substring(0, lastSpaceIndex) + '...';
             }
             return "Bot: " + trimmedText + '...';
        }
        return "Bot: " + text;
    }
    return "Yeni Sohbet";
}

function clearChat() {
    chatBox.innerHTML = '';

    const initialMessage = document.createElement("div");
    initialMessage.className = "message bot-message";
    initialMessage.innerHTML = `<strong>SibelGPT:</strong> Merhaba! Size nasıl yardımcı olabilirim? Emlak danışmanlığı, numeroloji, finans, yapay zeka veya genel kültür hakkında sorularınız varsa cevaplamaktan memnuniyet duyarım. Lütfen konuyu belirtirseniz size daha iyi yardımcı olabilirim.`;
    chatBox.appendChild(initialMessage);

    currentConversation = [];
    currentConversation.push({ sender: 'SibelGPT', text: initialMessage.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });

    highlightSelectedChat(null);

    // Yeni sohbette animasyonu tekrar oynat
    playInitialAnimation(); // Yeni sohbette tekrar oynatmak için bu satırı ekledik
}

function displayHistory() {
    const conversations = loadConversations();
    historyList.innerHTML = '';

    if (conversations.length === 0) {
        const placeholder = document.createElement('li');
        placeholder.textContent = 'Henüz kaydedilmiş sohbet yok.';
        placeholder.style.cursor = 'default';
        placeholder.style.opacity = '0.7';
        historyList.appendChild(placeholder);
        return;
    }

    conversations.forEach(conv => {
        const listItem = document.createElement('li');
        listItem.textContent = conv.title;
        listItem.setAttribute('data-chat-id', conv.id);
        historyList.appendChild(listItem);
    });
}

function loadConversation(chatId) {
    saveCurrentConversation();

    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId);

    if (conversationToLoad) {
        clearChat(); // Önce temizle (bu da welcome mesajını ekler)

        // Yüklenen sohbetin mesajlarını göster
        // clearChat welcome mesajını eklediği için, eğer yüklenen sohbette de ilk mesaj buysa atla
         conversationToLoad.messages.forEach((msg, index) => {
             // Eğer mesaj welcome mesajı değilse veya welcome mesajıysa ama yüklenen sohbette ilk mesaj değilse ekle
             // Basitlik için welcome mesajını clearChat'ten kaldırıp tüm mesajları buradan ekleyebiliriz.
             // Ya da şu anki gibi devam edip welcome mesajını kontrol ederiz.
             const isWelcomeMessage = msg.role === 'bot' && msg.text.includes('Merhaba! Size nasıl yardımcı olabilirim?');
             if (!isWelcomeMessage || index > 0) { // Welcome mesajı değilse ekle VEYA welcome mesajı ama ilk mesaj değilse ekle
                  appendMessage(msg.sender, msg.text, msg.role, false);
             } else if (isWelcomeMessage && index === 0) {
                  // Yüklenen sohbetin ilk mesajı welcome mesajı ve HTML/clearChat zaten ekledi, bir şey yapma.
             }
         });


        currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));

        highlightSelectedChat(chatId);
        stopInitialAnimation(); // Geçmişten sohbet yüklenince animasyonu durdur
        userInput.focus();

    } else {
        console.error("Yüklenmek istenen sohbet bulunamadı:", chatId);
        appendMessage("SibelGPT", "❌ Bu sohbet yüklenirken bir hata oluştu.", "bot", false);
    }
}

function highlightSelectedChat(chatId) {
    historyList.querySelectorAll('li').forEach(li => {
        li.classList.remove('selected');
    });

    if(chatId !== null){
        const selectedItem = historyList.querySelector(`li[data-chat-id="${chatId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
}


// Yeni: Başlangıç animasyonunu durduran fonksiyon
function stopInitialAnimation() {
    // Animasyonun kapsayıcısı görünürse ve video oynuyorsa
    if (initialAvatarAnimationContainer && initialAvatarAnimationContainer.style.display !== 'none' && initialAvatarAnimationContainer.style.opacity > 0) {
         if(talkingAvatarVideo) {
             talkingAvatarVideo.pause(); // Videoyu duraklat
             talkingAvatarVideo.currentTime = 0; // Video süresini başa al (isteğe bağlı)
         }
         initialAvatarAnimationContainer.style.opacity = 0; // Fade out başlat
         if (animationTimeout) {
             clearTimeout(animationTimeout);
             animationTimeout = null;
         }
         setTimeout(() => {
             if (initialAvatarAnimationContainer) { // Element hala varsa kontrolü
                 initialAvatarAnimationContainer.style.display = 'none';
             }
         }, 500); // CSS geçiş süresiyle aynı olmalı (0.5s)

         // Kullanıcı inputuna/keydown'una bağlı listenerları kaldır
         userInput.removeEventListener("input", stopInitialAnimationInstant); // anlık durdurma
         userInput.removeEventListener("keydown", stopInitialAnimationOnEnterKey); // Enter ile durdurma
    }
}

// Yeni: Başlangıç animasyonunu oynatan fonksiyon
function playInitialAnimation() {
     // Video elementi ve kapsayıcısı varsa
     if (talkingAvatarVideo && initialAvatarAnimationContainer) {
        console.log("Initial animation başlatılıyor...");
        // Animasyon divini görünür yap
        initialAvatarAnimationContainer.style.display = 'block';
        // Kısa bir gecikme ile fade-in başlat
        setTimeout(() => {
            initialAvatarAnimationContainer.style.opacity = 1;
            // Videoyu oynat
            talkingAvatarVideo.play().catch(error => {
                 // Autoplay engellenmiş olabilir
                 console.warn("Video autoplay hatası:", error);
                 // Kullanıcıya bir mesaj gösterebilir veya manuel başlatmasını isteyebilirsiniz.
                 // Örneğin: "Lütfen videoyu oynatmak için buraya tıklayın" gibi bir UI elemanı ekleyebilirsiniz.
             });
        }, 10); // Küçük gecikme

        // Animasyonun ne kadar süreceğini tahmin et (welcome mesajı uzunluğuna göre)
        const welcomeMessageElement = chatBox.querySelector('.bot-message strong');
        const welcomeMessageText = welcomeMessageElement ? welcomeMessageElement.nextSibling.textContent : '';
        const welcomeMessageLength = welcomeMessageText.length;
        const durationPerChar = 60; // ms/karakter
        const minDuration = 4000; // Minimum süre (ms)

        // Tahmini süreyi hesapla
        const animationDuration = Math.max(minDuration, welcomeMessageLength * durationPerChar);
        console.log(`Initial animation süresi: ${animationDuration}ms`);

        // Belirlenen süre sonunda animasyonu gizle
        animationTimeout = setTimeout(() => {
            stopInitialAnimation();
            console.log("Initial animation otomatik bitti.");
        }, animationDuration);

        // Kullanıcı inputuna veya Enter'a basılmasına tepki vererek animasyonu durdur
        // Sadece bir kere tetiklenmeli
        userInput.addEventListener("input", stopInitialAnimationInstant, { once: true }); // Yazmaya başlarsa anında durdur
        userInput.addEventListener("keydown", stopInitialAnimationOnEnterKey, { once: true }); // Enter'a basarsa durdur
     } else {
         console.error("Talking avatar video elementi veya kapsayıcısı bulunamadı.");
     }
}

// Yeni: Kullanıcı input alanına yazı yazdığında animasyonu anında durdur
function stopInitialAnimationInstant() {
     console.log("Kullanıcı yazmaya başladı, animasyon durduruluyor.");
     stopInitialAnimation();
}

// Yeni: Kullanıcı Enter tuşuna bastığında animasyonu durdur
function stopInitialAnimationOnEnterKey(event) {
     if (event.key === 'Enter') {
        console.log("Kullanıcı Enter'a bastı, animasyon durduruluyor.");
        stopInitialAnimation();
     }
}


// --- Olay Dinleyicileri ve Başlangıç Kodları ---

window.addEventListener("load", () => {
  // Element referanslarını ata
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");
  // Yeni: Animasyon video elementine ve kapsayıcısına referans
  talkingAvatarVideo = document.getElementById("talking-avatar-video");
  initialAvatarAnimationContainer = document.getElementById("initial-avatar-animation");

  // Animasyon div'ini başlangıçta JS ile de gizle (CSS'te de gizli ama emin olalım)
   if (initialAvatarAnimationContainer) {
       initialAvatarAnimationContainer.style.display = 'none';
       initialAvatarAnimationContainer.style.opacity = 0;
   }


  // Splash ekranının bitişini dinle
  const splashComputedStyle = getComputedStyle(splashScreen);
  if (splashComputedStyle.opacity == 0 || splashComputedStyle.display == 'none') {
      // Eğer splash zaten gizliyse doğrudan arayüzü başlat
      initializeChatInterface();
  } else {
      // Splash animasyonu bitince arayüzü başlat
      splashScreen.addEventListener('animationend', () => {
        splashScreen.style.opacity = 0;
        setTimeout(() => {
          splashScreen.style.display = "none";
          initializeChatInterface(); // Splash bittikten sonra ilk yapılacaklar
        }, 100); // Küçük bir gecikme
      });
  }


  // Olay dinleyicilerini ekle (genel olarak sayfa ömrü boyunca kalacaklar)
  userInput.addEventListener("keypress", handleInputKeyPress); // Enter tuşu dinleyicisi (sendMessage çağırır)
  newChatButton.addEventListener("click", handleNewChat); // Yeni sohbet butonu
  historyList.addEventListener("click", handleHistoryClick); // Geçmiş listesi (event delegation)

  // NOT: Kullanıcı inputuna bağlı animasyon durdurma listenerları, playInitialAnimation içinde eklenir.
});

// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor...");
    // Geçmiş sohbetleri yükle ve sidebar'da göster
    displayHistory();

    // Sayfa yüklendiğinde, eğer geçmiş yüklü değilse (yani ilk kez açılıyorsa)
    // hoş geldiniz mesajını currentConversation'a ekle ve başlangıç animasyonunu başlat
    const conversations = loadConversations();
     // Eğer hiç kaydedilmiş sohbet yoksa VEYA kaydedilmiş sohbet olsa bile şu anki sohbet boşsa (clearChat veya ilk açılış sonrası)
    if (conversations.length === 0 || (conversations.length > 0 && currentConversation.length <= 1)) {
         // clearChat() içinde zaten welcome mesajı ekleniyor ve currentConversation güncelleniyor.
         // Bu yüzden sadece animasyonu başlatmamız yeterli.
         console.log("İlk yükleme veya boş sohbet, animasyon başlatılıyor.");
         playInitialAnimation();
    } else {
         console.log("Geçmiş yüklendi veya sohbet devam ediyor, animasyon oynatılmıyor.");
         // Eğer geçmiş yüklendiğinde playInitialAnimation'ı durdurmak istiyorsak,
         // loadConversation() içinde stopInitialAnimation() çağrılmalı.
         // Bu zaten loadConversation içinde yapılıyor.
    }

    // Sayfa yüklendiğinde inputa odaklan
    // Küçük bir gecikme, splash ekranı tamamen kalktıktan sonra odaklanmak için iyi olabilir
    setTimeout(() => {
        userInput.focus();
    }, 100); // 100ms gecikme
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    saveCurrentConversation(); // Mevcut sohbeti kaydet

    clearChat(); // Chat kutusunu temizle ve welcome mesajını ekle

    // Yeni sohbete başlarken animasyonu tekrar oynat
    playInitialAnimation(); // playInitialAnimation artık clearChat içinde değil, burada çağırılmalı

    userInput.focus();
}


// Geçmiş listesi tıklama yöneticisi (Event Delegation kullanıldı)
function handleHistoryClick(event) {
    const clickedElement = event.target;

    if (clickedElement.tagName === 'LI' && clickedElement.hasAttribute('data-chat-id')) {
        const chatId = clickedElement.getAttribute('data-chat-id');
        console.log("Geçmiş sohbet yükleniyor:", chatId);
         if (currentConversation.length > 0 && currentConversation[0].id == chatId) {
             console.log("Aynı sohbet zaten açık.");
             highlightSelectedChat(chatId);
         } else {
            loadConversation(chatId); // loadConversation içinde saveCurrentConversation ve stopInitialAnimation var
         }
         userInput.focus();
    }
}


// Sayfa kapatılmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
    saveCurrentConversation();
});
