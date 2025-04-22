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
// Autoplay yedek elementine referans
let autoplayFallback;


// Animasyonun gizlenmesi için kullanılacak timeout ID'si
let animationTimeout;

// Video manuel olarak başlatıldı mı? (Autoplay engellendiğinde tıklanırsa)
let isVideoManuallyPlayed = false;


// --- Mesaj Gönderme ve Alma Fonksiyonları ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Kullanıcı mesaj yazdığında animasyonu durdur
  stopInitialAnimation();

  // Kullanıcının mesajını ekle ve currentConversation'a kaydet
  appendMessage("Sen", message, "user", true);
  userInput.value = "";

  try {
    // Backend API'sine mesajı gönder
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", { // URL'yi kendi Render URL'nizle değiştirin
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";

    appendMessage("SibelGPT", reply, "bot", true);

  } catch (error) {
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot", true);
    console.error("Mesaj gönderirken hata:", error);
  }
}

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
    if (currentConversation.length <= 1) {
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

    playInitialAnimation(); // Yeni sohbette animasyonu tekrar oynat

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
    saveCurrentConversation();

    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId);

    if (conversationToLoad) {
        clearChat(); // Önce mevcut sohbeti temizle (ve welcome mesajını ekle)

         conversationToLoad.messages.forEach((msg, index) => {
             const isWelcomeMessage = msg.role === 'bot' && msg.text.includes('Merhaba! Size nasıl yardımcı olabilirim?');
             if (!isWelcomeMessage || index > 0) {
                  appendMessage(msg.sender, msg.text, msg.role, false);
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
    // Animasyonun kapsayıcısı görünürse
    if (initialAvatarAnimationContainer && initialAvatarAnimationContainer.style.display !== 'none') {
         if(talkingAvatarVideo) {
             talkingAvatarVideo.pause(); // Videoyu duraklat
             // talkingAvatarVideo.currentTime = 0; // Süreyi başa al
         }

         initialAvatarAnimationContainer.style.opacity = 0; // Fade out başlat
         if (animationTimeout) {
             clearTimeout(animationTimeout);
             animationTimeout = null;
         }

         // Autoplay yedeği görünüyorsa gizle
         if (autoplayFallback) {
             autoplayFallback.style.opacity = 0;
             setTimeout(() => {
                 if (autoplayFallback) autoplayFallback.style.display = 'none';
             }, 300); // Yedek için kısa fade out süresi
         }


         setTimeout(() => {
             if (initialAvatarAnimationContainer) {
                 initialAvatarAnimationContainer.style.display = 'none';
             }
         }, 500); // Ana kapsayıcı fade out süresi (CSS ile aynı)

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
        // isVideoManuallyPlayed bayrağını sıfırla (autoplay denenecek)
        isVideoManuallyPlayed = false;

         // Fade-in başlat
        setTimeout(() => {
            initialAvatarAnimationContainer.style.opacity = 1;
            // Videoyu oynatma denemesi
            talkingAvatarVideo.play().then(() => {
                 // Autoplay başarılı oldu
                 console.log("Video autoplay başarılı.");
                 // Yedek elemanı gizle (başlangıçta gizli olsa da emin olalım)
                 if (autoplayFallback) {
                     autoplayFallback.style.display = 'none';
                     autoplayFallback.style.opacity = 0;
                 }

            }).catch(error => {
                 // Autoplay engellendi
                 console.warn("Video autoplay engellendi:", error);
                 // Yedek elemanı görünür yap ve oynatmak için tıkla mesajını göster
                 if (autoplayFallback) {
                     autoplayFallback.style.display = 'flex'; // Flex olarak ayarladık CSS'te
                     setTimeout(() => { // Kısa gecikme ile fade-in
                         if (autoplayFallback) autoplayFallback.style.opacity = 1;
                     }, 10);
                 }
                 // isVideoManuallyPlayed = false olarak kalır
             });
        }, 10); // Küçük gecikme

        // Animasyonun ne kadar süreceğini tahmin et (welcome mesajı uzunluğuna göre)
        // Eğer autoplay engellenirse bu süre sonunda video durmayacak, sadece container gizlenecek.
        // Bu durumda kullanıcı manuel başlatmadıysa sadece static ilk frame görünecek.
        const welcomeMessageElement = chatBox.querySelector('.bot-message strong');
        const welcomeMessageText = welcomeMessageElement ? welcomeMessageElement.nextSibling.textContent : '';
        const welcomeMessageLength = welcomeMessageText.length;
        const durationPerChar = 60; // ms/karakter
        const minDuration = 4000; // Minimum süre (ms)

        const animationDuration = Math.max(minDuration, welcomeMessageLength * durationPerChar);
        console.log(`Initial animation süresi (tahmini): ${animationDuration}ms`);

        // Belirlenen süre sonunda animasyonu gizle
        animationTimeout = setTimeout(() => {
            // Eğer video manuel olarak başlatılmadıysa ve autoplay de engellendiyse
            // (yani hala autoplayFallback görünüyorsa), sadece container'ı gizle.
            // Video zaten oynamıyordur.
            if (!isVideoManuallyPlayed && autoplayFallback && autoplayFallback.style.display !== 'none') {
                 console.log("Animasyon süresi doldu, video oynamıyordu, sadece container gizleniyor.");
                 initialAvatarAnimationContainer.style.opacity = 0;
                  if (autoplayFallback) { // Yedek de gizlensin
                     autoplayFallback.style.opacity = 0;
                     setTimeout(() => {
                         if (autoplayFallback) autoplayFallback.style.display = 'none';
                     }, 300);
                 }
                 setTimeout(() => {
                    if (initialAvatarAnimationContainer) initialAvatarAnimationContainer.style.display = 'none';
                 }, 500);

            } else {
                // Video oynuyorsa (autoplay veya manuel başlatıldıysa), normal durdurma fonksiyonunu çağır
                console.log("Animasyon süresi doldu, video oynuyordu, normal durdurma.");
                stopInitialAnimation();
            }
            animationTimeout = null; // Timeout bitti, null yap
        }, animationDuration);

        // Kullanıcı inputuna veya Enter'a basılmasına tepki vererek animasyonu durdur
        // Sadece bir kere tetiklenmeli
        userInput.addEventListener("input", stopInitialAnimationInstant, { once: true });
        userInput.addEventListener("keydown", stopInitialAnimationOnEnterKey, { once: true });

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

// Yeni: Animasyon kapsayıcısına tıklanınca videoyu başlat
function handleAnimationContainerClick() {
    // Eğer video duraklatılmışsa (autoplay engellendiği için olabilir)
    if (talkingAvatarVideo && talkingAvatarVideo.paused) {
        console.log("Animasyon kapsayıcısına tıklandı, video oynatılıyor...");
        talkingAvatarVideo.play().then(() => {
             // Oynatma başarılı oldu
             isVideoManuallyPlayed = true; // Manuel başlatıldı bayrağını set et
             // Yedek elemanı gizle
             if (autoplayFallback) {
                 autoplayFallback.style.opacity = 0;
                 setTimeout(() => {
                    if (autoplayFallback) autoplayFallback.style.display = 'none';
                 }, 300);
             }
        }).catch(error => {
            console.error("Video manuel oynatma hatası:", error);
            // Kullanıcıya hala oynatılamadığı bilgisi verilebilir
        });
    }
    // Eğer video zaten oynuyorsa veya oynamaya çalışıyorsa bir şey yapma.
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
  // Autoplay yedek elementine referans
  autoplayFallback = document.querySelector("#initial-avatar-animation .autoplay-fallback");


  // Animasyon div'ini başlangıçta JS ile de gizle
   if (initialAvatarAnimationContainer) {
       initialAvatarAnimationContainer.style.display = 'none';
       initialAvatarAnimationContainer.style.opacity = 0;
   }
    // Yedek elemanı da başlangıçta gizle
   if (autoplayFallback) {
       autoplayFallback.style.display = 'none';
       autoplayFallback.style.opacity = 0;
   }


  // Splash ekranının bitişini dinle veya zaten gizliyse başlat
  const splashComputedStyle = getComputedStyle(splashScreen);
  if (splashComputedStyle.opacity == 0 || splashComputedStyle.display == 'none') {
      initializeChatInterface();
  } else {
      splashScreen.addEventListener('animationend', () => {
        splashScreen.style.opacity = 0;
        setTimeout(() => {
          splashScreen.style.display = "none";
          initializeChatInterface();
        }, 100);
      });
  }

  // Olay dinleyicilerini ekle (genel olarak sayfa ömrü boyunca kalacaklar)
  userInput.addEventListener("keypress", handleInputKeyPress);
  newChatButton.addEventListener("click", handleNewChat);
  historyList.addEventListener("click", handleHistoryClick);

  // Yeni: Animasyon kapsayıcısına tıklama dinleyicisi ekle
  if (initialAvatarAnimationContainer) {
       initialAvatarAnimationContainer.addEventListener('click', handleAnimationContainerClick);
  }

});

// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor...");
    displayHistory();

     // Sayfa yüklendiğinde, eğer currentConversation boşsa (welcome mesajı haricinde)
     // currentConversation'ı welcome mesajıyla başlatır ve animasyonu oynatır.
     // clearChat() içinde zaten welcome mesajı ekleniyor ve currentConversation güncelleniyor
     // ve clearChat playInitialAnimation'ı çağırıyor.
     // Bu durumda initializeChatInterface sadece clearChat çağırmalı.

     // clearChat çağrısı kaldırıldı, çünkü loadConversation çağrılırsa da temizleniyor.
     // İlk yüklemede, eğer geçmiş yoksa, currentConversation boş olacaktır.
     // Bu durumda playInitialAnimation'ı çağırmalıyız.
     // Eğer geçmiş varsa, loadConversation çağrılacak ve animasyon durdurulacak.

    const conversations = loadConversations();
    if (conversations.length > 0) {
        console.log("Son sohbet yükleniyor...");
        // loadConversation içinde clearChat var ve animasyon durduruluyor
        loadConversation(conversations[0].id);
        highlightSelectedChat(conversations[0].id);
    } else {
        console.log("Hiç sohbet yok, yeni sohbet başlatılıyor...");
         // clearChat çağrısı burada olmalıydı, ama clearChat zaten playInitialAnimation çağırıyor.
         // Bu durumda initializeChatInterface sadece playInitialAnimation çağırıp,
         // welcome mesajının ve boş chatBox'ın yönetimi başka yerde olmalı.
         // En basit yol: initializeChatInterface'ı basitleştirelim.
         // clearChat()'i sadece yeni sohbet butonuna bağlayalım.
         // loadConversation() sadece geçmişi yüklesin.
         // initializeChatInterface() sadece displayHistory'yi çağırıp,
         // ilk yüklemede chatBox'a welcome mesajı eklesin VE animasyonu oynatsın.


        // -- Mantığı tekrar düzenleyelim (en temiz yol): --
        // 1. HTML: ChatBox boş başlasın, welcome mesajı olmasın.
        // 2. clearChat(): Sadece chatBox'ı temizlesin, currentConversation'ı sıfırlasın.
        // 3. loadConversation(): ChatBox'ı temizlemesin, mesajları append etsin. currentConversation'ı set etsin.
        // 4. initializeChatInterface(): displayHistory'yi çağır. ChatBox boşsa welcome mesajını append et, currentConversation'ı başlat, animasyonu oynat.
        // 5. handleNewChat(): saveCurrentConversation, clearChat, append welcome mesajı, playInitialAnimation.

        // --- Bu değişiklikler önceki kodları çok etkileyecek. Şimdilik en basit düzeltmeyi yapalım: ---
        // clearChat welcome mesajı eklemeye devam etsin.
        // initializeChatInterface sadece welcome mesajı yoksa (ilk yükleme) animasyonu oynatsın.
        // loadConversation welcome mesajı yoksa append etsin.

        // Şu anki initialize logic'i:
        // Eğer chatBox'ta welcome mesajı varsa VE currentConversation'da yoksa veya farklıysa:
        //   currentConversation'ı welcome ile başlat VE playInitialAnimation çağır.
        // Bu, ilk yüklemede (eğer geçmiş yüklenmediyse) çalışmalı.
        // Eğer geçmiş yüklenirse, loadConversation clearChat çağırıyor ve welcome mesajı ekleniyor.
        // Sonra loadConversation mesajları append ediyor.
        // Bu durumda initializeChatInterface tekrar çağrılmıyor.
        // Yani şimdiki initialize logic'i doğru gibi görünüyor, ilk yüklemede çalışır.

        // Sadece sayfa ilk yüklendiğinde hoş geldiniz mesajı eklenmeli, geçmiş yüklenirken veya yeni sohbette tekrar eklenmemeli.
        // HTML'deki hoş geldiniz mesajını kaldırıp, SADECE initializeChatInterface içinde bir kere eklemek en temiz yoldur.
        // Veya clearChat içinden welcome mesajını ekleme logic'ini kaldırıp, sadece initialize ve handleNewChat içinde ekleriz.

        // --- HTML'deki Welcome Mesajını Kaldırıp JS ile Sadece initializeChatInterface içinde Ekleyelim ---
        // Bu, kodun yönetimini kolaylaştırır.

        // HTML'den welcome mesajını kaldırın.
        // chatBox.innerHTML = ''; // initializeChatInterface'ın başında temizlik

        // const initialMessage = document.createElement("div");
        // initialMessage.className = "message bot-message";
        // initialMessage.innerHTML = `<strong>SibelGPT:</strong> Merhaba! Size nasıl yardımcı olabilirim?...`;
        // chatBox.appendChild(initialMessage);
        // currentConversation = [];
        // currentConversation.push({ sender: 'SibelGPT', text: initialMessage.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });

        // playInitialAnimation(); // Ve animasyonu oynat


        // --- Şimdilik Kodları Bu Haliyle Verelim ---
        // Mevcut kodda welcome mesajı hem HTML'de var, hem clearChat ekliyor, hem initialize kontrol ediyor.
        // Bu kafa karıştırıcı. En basit düzeltme:

         displayHistory(); // Geçmişi göster

         // Eğer hiç mesaj yoksa (hem HTML'de hem JS currentConversation'da)
         if(chatBox.children.length === 0 && currentConversation.length === 0) {
              // Hoş geldiniz mesajını ekle
             const initialMessage = document.createElement("div");
             initialMessage.className = "message bot-message";
             initialMessage.innerHTML = `<strong>SibelGPT:</strong> Merhaba! Size nasıl yardımcı olabilirim?...`;
             chatBox.appendChild(initialMessage);
              // currentConversation'ı başlat
             currentConversation.push({ sender: 'SibelGPT', text: initialMessage.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
             // Animasyonu oynat
             playInitialAnimation();
             console.log("İlk yükleme - Hoş geldiniz mesajı eklendi ve animasyon başlatıldı.");

         } else {
             // Mesajlar zaten varsa (HTML'den gelen welcome veya geçmişten yüklenen)
             // currentConversation'ı HTML'deki welcome mesajı varsa başlat
             const initialBotMessageElement = chatBox.querySelector('.bot-message');
             if(initialBotMessageElement && initialBotMessageElement.textContent.includes('Merhaba! Size nasıl yardımcı olabilirim?') && currentConversation.length === 0) {
                  currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
                  console.log("Yenileme? - HTML'deki welcome mesajı currentConversation'a eklendi.");
                  // Yenilemede animasyon oynatma
             } else {
                 console.log("ChatBox'ta mesajlar var veya currentConversation dolu. Animasyon oynatılmıyor.");
             }
         }

         // Inputa odaklan
         setTimeout(() => {
              userInput.focus();
         }, 100);

}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    saveCurrentConversation(); // Mevcut sohbeti kaydet

    clearChat(); // Chat kutusunu temizle VE welcome mesajını ekle VE currentConversation'ı sıfırla+welcome ekle

    // Animasyonu tekrar oynat (clearChat içinde çağrılıyor)
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
            // Geçmiş yüklenince chatBox temizlenir, welcome mesajı eklenir ve yüklü mesajlar append edilir.
            // Animasyon durdurulur.
            loadConversation(chatId); // loadConversation içinde saveCurrentConversation ve stopInitialAnimation var
         }
         userInput.focus();
    }
}


// Sayfa kapatılmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
    saveCurrentConversation();
});
