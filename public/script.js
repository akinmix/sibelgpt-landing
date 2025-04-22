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
// Animasyon video elementine referans
let talkingAvatarVideo;
// Animasyonun kapsayıcı div'ine referans (görünürlük kontrolü için)
let initialAvatarAnimationContainer;

// Animasyonun gizlenmesi için kullanılacak timeout ID'si
let animationTimeout;


// --- Mesaj Gönderme ve Alma Fonksiyonları ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Kullanıcı mesaj yazdığında animasyonu durdur
  stopInitialAnimation(); // stopInitialAnimation video elementini yönetecek

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
    if (currentConversation.length <= 1) { // En az bir kullanıcı mesajı olmalı (welcome mesajı + 1 kullanıcı mesajı)
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

    // Yeni sohbette de ilk hoş geldiniz mesajı görünsün (HTML'deki gibi)
    const initialMessage = document.createElement("div");
    initialMessage.className = "message bot-message";
    initialMessage.innerHTML = `<strong>SibelGPT:</strong> Merhaba! Size nasıl yardımcı olabilirim? Emlak danışmanlığı, numeroloji, finans, yapay zeka veya genel kültür hakkında sorularınız varsa cevaplamaktan memnuniyet duyarım. Lütfen konuyu belirtirseniz size daha iyi yardımcı olabilirim.`;
    chatBox.appendChild(initialMessage);


    currentConversation = [];
    // Welcome mesajını currentConversation'a ekle
    currentConversation.push({ sender: 'SibelGPT', text: initialMessage.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });


    highlightSelectedChat(null);

    // Yeni sohbete başlarken animasyonu tekrar oynat
    playInitialAnimation(); // Yeni sohbette tekrar oynatmak için bu satırı etkinleştirdik

    // Yeni sohbette inputa odaklan
    userInput.focus();
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
    saveCurrentConversation(); // Önce o anki sohbeti kaydet

    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId);

    if (conversationToLoad) {
        clearChat(); // Önce mevcut sohbeti temizle (ve welcome mesajını ekle)

        // Yüklenen sohbetin mesajlarını göster
        // clearChat welcome mesajını eklediği için, eğer yüklenen sohbette de ilk mesaj buysa atla
         conversationToLoad.messages.forEach((msg, index) => {
             const isWelcomeMessage = msg.role === 'bot' && msg.text.includes('Merhaba! Size nasıl yardımcı olabilirim?');
             if (!isWelcomeMessage || index > 0) { // Welcome mesajı değilse ekle VEYA welcome mesajı ama ilk mesaj değilse ekle
                  appendMessage(msg.sender, msg.text, msg.role, false); // Sadece göster, tekrar kaydetme
             }
         });

        // currentConversation'ı yüklenen sohbetin mesajlarıyla güncelle (derin kopya al)
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
    // Animasyonun kapsayıcısı görünürse ve video elementi varsa
    if (initialAvatarAnimationContainer && initialAvatarAnimationContainer.style.display !== 'none' && talkingAvatarVideo) {
         talkingAvatarVideo.pause(); // Videoyu duraklat
         // talkingAvatarVideo.currentTime = 0; // Video süresini başa al (isteğe bağlı, isterseniz kaldırın)

         initialAvatarAnimationContainer.style.opacity = 0; // Fade out başlat
         if (animationTimeout) {
             clearTimeout(animationTimeout);
             animationTimeout = null;
         }
         setTimeout(() => {
             if (initialAvatarAnimationContainer) {
                 initialAvatarAnimationContainer.style.display = 'none';
             }
         }, 500); // CSS geçiş süresiyle aynı olmalı (0.5s)

         // Kullanıcı inputuna/keydown'una bağlı listenerları kaldır
         userInput.removeEventListener("input", stopInitialAnimationInstant);
         userInput.removeEventListener("keydown", stopInitialAnimationOnEnterKey);
         console.log("Initial animation durduruldu.");
    }
}

// Yeni: Başlangıç animasyonunu oynatan fonksiyon
function playInitialAnimation() {
     // Video elementi ve kapsayıcısı varsa
     if (talkingAvatarVideo && initialAvatarAnimationContainer) {
        console.log("Initial animation başlatılıyor...");
        // Animasyon divini görünür yap
        initialAvatarAnimationContainer.style.display = 'block';
        // Video süresini başa al (her başladığında baştan oynasın)
        talkingAvatarVideo.currentTime = 0;
         // Fade-in başlat
        setTimeout(() => {
            initialAvatarAnimationContainer.style.opacity = 1;
            // Videoyu oynat
            talkingAvatarVideo.play().catch(error => {
                 // Autoplay engellenmiş olabilir
                 console.warn("Video autoplay hatası:", error);
                 // Kullanıcıya bilgi verebilir veya tıklandığında başlatmasını isteyebilirsiniz.
                 // Örneğin, animasyon container div'ine click listener ekleyip play() çağırabilirsiniz.
                 // initialAvatarAnimationContainer.addEventListener('click', () => talkingAvatarVideo.play());
             });
        }, 10); // Küçük gecikme

        // Animasyonun ne kadar süreceğini tahmin et (welcome mesajı uzunluğuna göre)
        const welcomeMessageElement = chatBox.querySelector('.bot-message strong');
        const welcomeMessageText = welcomeMessageElement ? welcomeMessageElement.nextSibling.textContent : '';
        const welcomeMessageLength = welcomeMessageText.length;
        const durationPerChar = 60; // ms/karakter
        const minDuration = 4000; // Minimum süre (ms)

        const animationDuration = Math.max(minDuration, welcomeMessageLength * durationPerChar);
        console.log(`Initial animation süresi (tahmini): ${animationDuration}ms`);

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
     // Sadece Enter tuşu için
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
  // Animasyon video elementine ve kapsayıcısına referans
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
  // Enter tuşu ile gönderme listener'ı (bu sendMessage'ı çağırır, sendMessage da animasyonu durdurur)
  userInput.addEventListener("keypress", handleInputKeyPress);
  // Yeni sohbet butonu
  newChatButton.addEventListener("click", handleNewChat);
  // Geçmiş listesi (event delegation)
  historyList.addEventListener("click", handleHistoryClick);

  // NOT: Kullanıcı inputuna bağlı animasyon durdurma listenerları, playInitialAnimation içinde eklenir.
});

// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor...");
    // Geçmiş sohbetleri yükle ve sidebar'da göster
    displayHistory();

    // Sayfa yüklendiğinde, eğer mevcut sohbet boşsa (welcome mesajı haricinde)
    // animasyonu başlat ve hoş geldiniz mesajını ekle (clearChat içinde zaten ekleniyor)
    // Local Storage'da hiç sohbet olmaması durumu initializeChatInterface'e özel bir durum değil.
    // clearChat() fonksiyonu artık hem chatBox'ı temizliyor hem de welcome mesajını ekliyor
    // ve currentConversation'ı welcome mesajıyla başlatıyor.
    // playInitialAnimation ise clearChat içinde çağrılıyor.
    // Yani, initializeChatInterface fonksiyonunda sadece clearChat() çağırmamız yeterli.
    // Bu, ilk yüklemede de chatBox'ı temizleyecek, welcome mesajını ekleyecek ve animasyonu oynatacak.

    // initializeChatInterface çağrıldığında *her zaman* chatBox'ı temizleyip welcome mesajını ekleyelim.
    // Eğer geçmiş yüklendiğinde bunu istemiyorsak, loadConversation içinde clearChat'i çağırmayız.
    // Şu anki yapıda hem initialize hem de loadConversation clearChat çağırıyor, bu sorunlu.

    // Düzeltilmiş Mantık:
    // 1. initializeChatInterface: Sadece displayHistory'yi çağır. Sohbet yükleme veya yeni sohbet başlatma mantığını buraya koyma.
    // 2. window.load: Splash bittikten sonra initializeChatInterface'i çağır. Ardından otomatik olarak ya en son sohbeti yükle (varsa) ya da yeni bir sohbet başlat.
    // 3. loadConversation: Sohbeti yükle, ardından stopInitialAnimation ve input focus yap.
    // 4. handleNewChat: Mevcut sohbeti kaydet, ardından yeni bir sohbet başlat (clearChat çağır, playInitialAnimation çağır, input focus yap).

    // Yeni initializeChatInterface (Düzeltildi)
    // displayHistory(); // displayHistory hala burada çağırılmalı
    // console.log("Initialize finished. Attempting to load last chat or start new.");

    // // Splash bittikten sonra otomatik olarak en son sohbeti yükle VEYA yeni sohbet başlat
    // const conversations = loadConversations();
    // if (conversations.length > 0) {
    //      console.log("Son sohbet yükleniyor...");
    //      loadConversation(conversations[0].id); // En son sohbeti yükle
    //      highlightSelectedChat(conversations[0].id); // Yüklenen sohbeti vurgula
    // } else {
    //      console.log("Hiç sohbet yok, yeni sohbet başlatılıyor...");
    //      handleNewChat(); // Yeni sohbet başlat (bu clearChat ve playInitialAnimation çağırır)
    // }

    // -- Önceki logic'e geri dönelim ve onu düzelteyim. Daha basit olabilir. --
    // Önceki logic: initializeChatInterface sadece ilk yüklemede animasyonu oynatacak.
    // Bu durumda clearChat welcome mesajını eklemeye devam etmeli.

     displayHistory();

     // Eğer currentConversation boşsa (yani ilk yükleme) ve chatBox'ta welcome mesajı varsa animasyonu oynat
     // Bu kontrol, sayfa yenilemede animasyonun sadece bir kere oynamasını sağlamalı.
     const initialBotMessageElement = chatBox.querySelector('.bot-message');
     const hasWelcomeMessageInChatBox = initialBotMessageElement && initialBotMessageElement.textContent.includes('Merhaba! Size nasıl yardımcı olabilirim?');

     // CurrentConversation'ın welcome mesajını içerip içermediğini kontrol et
     const hasWelcomeMessageInCurrentConv = currentConversation.length > 0 && currentConversation[0].role === 'bot' && currentConversation[0].text.includes('Merhaba! Size nasıl yardımcı olabilirim?');

     // Eğer chatBox'ta welcome mesajı varsa VE currentConversation'da welcome mesajı yoksa veya farklıysa
     // Bu durum genellikle ilk yüklemede olur.
     if (hasWelcomeMessageInChatBox && !hasWelcomeMessageInCurrentConv) {
        // CurrentConversation'ı welcome mesajıyla başlat
        currentConversation = []; // Tamamen sıfırla
        currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
        console.log("Hoş geldiniz mesajı currentConversation'a eklendi ve animasyon başlatılıyor.");
        playInitialAnimation(); // Animasyonu başlat
     } else {
        console.log("Hoş geldiniz mesajı zaten currentConversation'da veya chatBox boş, animasyon oynatılmıyor.");
        // Bu durum, geçmiş yüklendiğinde veya yeni sohbet butonuna basıldığında olabilir.
        // clearChat() fonksiyonu artık playInitialAnimation'ı çağırıyor, bu doğru yer.
     }

     // Sayfa yüklendiğinde inputa odaklan
     setTimeout(() => {
         userInput.focus();
     }, 100);
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    saveCurrentConversation(); // Mevcut sohbeti kaydet
    clearChat(); // Chat kutusunu temizle, welcome mesajını ekle ve currentConversation'ı sıfırla+welcome ekle

    // clearChat içinde playInitialAnimation çağrılıyor, buraya tekrar gerek yok.
    // playInitialAnimation();

    console.log("Yeni sohbet başlatıldı. Animasyon oynatıldı (clearChat içinde).");

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
