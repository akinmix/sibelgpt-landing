// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

// Şu anki sohbetin mesajlarını tutacak dizi
let currentConversation = [];

// DOM elementlerine referanslar (sayfa yüklendiğinde atanacak)
let chatBox;
let userInput;
let sendButton; // Gönder butonuna referans ekledik
let newChatButton;
let historyList;
let splashScreen;
let typingIndicatorElement = null; // Aktif 'yazıyor...' animasyonunu tutacak değişken

// --- Typing Indicator (Yazıyor Animasyonu) Fonksiyonları ---

function showTypingIndicator() {
  // Eğer zaten bir gösterge varsa, tekrar ekleme
  if (typingIndicatorElement) return;

  // Gösterge için ana div'i oluştur (CSS'deki .typing-indicator)
  typingIndicatorElement = document.createElement("div");
  // Temel mesaj stillerini ve bot rolünü + özel gösterge stilini ekle
  typingIndicatorElement.className = "message bot-message typing-indicator";

  // İçine 3 tane nokta (div) ekle (CSS'deki .typing-dot)
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("div");
    dot.className = "typing-dot";
    typingIndicatorElement.appendChild(dot);
  }

  // Oluşturulan göstergeyi chat kutusuna ekle
  chatBox.appendChild(typingIndicatorElement);

  // Chat kutusunu en alta kaydırarak göstergenin görünmesini sağla
  scrollToBottom();
}

function hideTypingIndicator() {
  // Eğer bir gösterge varsa ve chat kutusunda bulunuyorsa
  if (typingIndicatorElement && chatBox.contains(typingIndicatorElement)) {
    // Chat kutusundan kaldır
    chatBox.removeChild(typingIndicatorElement);
  }
  // Referansı temizle
  typingIndicatorElement = null;
}


// --- Mesaj Gönderme ve Alma Fonksiyonları (Güncellendi) ---

async function sendMessage() {
  const message = userInput.value.trim();
  // Input pasifse veya mesaj boşsa gönderme
  if (!message || userInput.disabled) return;

  // Kullanıcının mesajını ekle ve currentConversation'a kaydet
  appendMessage("Sen", message, "user", true);
  userInput.value = ""; // Giriş alanını temizle

  // -------- YAZIYOR ANIMASYONU BAŞLATMA --------
  showTypingIndicator();
  // -------- Input ve Butonu Pasif Yap --------
  userInput.disabled = true;
  sendButton.disabled = true;
  // -------------------------------------------

  try {
    // Backend API'sine mesajı gönder
    const response = await fetch("https://sibelgpt-backend.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question: message }),
    });

    if (!response.ok) {
        // Eğer HTTP status kodu 2xx değilse (örn: 404, 500)
        // Hata mesajını JSON'dan almaya çalış (eğer backend hata mesajı gönderiyorsa)
        // Veya genel bir hata mesajı ver
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
             // JSON parse edilemiyorsa veya response boşsa
             errorData = { reply: `Sunucu hatası: ${response.status}` };
        }
        // Hata mesajını data.reply gibi bir alandan almayı deneyebiliriz
        throw new Error(errorData.reply || `Sunucu hatası: ${response.status}`);
    }


    const data = await response.json();
    const reply = data.reply || "❌ Anlaşılmayan bir cevap alındı."; // Daha spesifik hata

    // Gerçek cevabı eklemeden ÖNCE animasyonu kaldırdığımızdan emin olmalıyız (finally yapar)
    appendMessage("SibelGPT", reply, "bot", true); // true: geçmişe ekle

  } catch (error) {
    // Hata mesajını göster (fetch hatası veya yukarıdaki response.ok hatası)
    // error.message kullanarak daha detaylı bilgi verebiliriz
    const errorMessage = error.message || "❌ Bir hata oluştu. Sunucuya ulaşılamıyor veya beklenmedik bir sorun oluştu.";
    appendMessage("SibelGPT", errorMessage, "bot", true); // true: geçmişe ekle
    console.error("Mesaj gönderirken hata:", error);
  } finally {
    // -------- BU BLOK HER ZAMAN ÇALIŞIR (Hata olsa da olmasa da) --------
    hideTypingIndicator(); // Animasyonu kaldır
    // -------- Input ve Butonu Aktif Yap --------
    userInput.disabled = false;
    sendButton.disabled = false;
    userInput.focus(); // Tekrar input'a odaklan
    // -------------------------------------------
  }
}

// appendMessage fonksiyonu mesaj ekleme ve scroll yapma işlemini yapar
function appendMessage(sender, text, role, addToHistory = false) {
  const messageElem = document.createElement("div");

  // Sınıf adını ayarla (indicator için ayrı bir işlem yok, çünkü ayrı fonksiyonla ekleniyor)
  messageElem.className = "message " + role + "-message"; // Sınıf adı: message user-message veya message bot-message

  // İçeriği ayarla (Güvenlik odaklı)
  const senderElem = document.createElement("strong");
  senderElem.textContent = `${sender}: `; // Gönderen adı (textContent güvenli)
  messageElem.appendChild(senderElem);

  const textNode = document.createTextNode(text); // Mesaj metni (textContent güvenli)
  messageElem.appendChild(textNode);

  // Mesajı chat kutusuna ekle
  chatBox.appendChild(messageElem);

  // Mesajı konuşma geçmişine ekle (eğer addToHistory true ise ve indicator değilse)
  if (addToHistory && role !== 'typing-indicator') {
     currentConversation.push({ sender, text, role });
  }

  // Mesaj eklendikten sonra en alta kaydır
  scrollToBottom();
}

// Sohbet kutusunu en alta kaydıran yardımcı fonksiyon
function scrollToBottom() {
    // Kısa bir gecikme, eleman DOM'a eklendikten sonra scroll yapar
    setTimeout(() => {
      // Önce chatBox'ın varlığını kontrol edelim
      if (chatBox) {
          chatBox.scrollTop = chatBox.scrollHeight;
      }
    }, 50);
}


function handleInputKeyPress(event) {
    // Eğer input pasifse Enter'a basılmasını engelle
    if (userInput.disabled) {
        event.preventDefault();
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault(); // Formun submit olmasını engelle (gerçi form yok ama alışkanlık)
        sendMessage();
    }
}


// --- Sohbet Geçmişi Fonksiyonları (Local Storage Tabanlı) ---
// Değişiklik yok...

function loadConversations() {
    const conversationsJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    try {
        // Eğer local storage boşsa veya geçersiz JSON içeriyorsa boş array döndür
        return conversationsJson ? JSON.parse(conversationsJson) : [];
    } catch (e) {
        console.error("Sohbet geçmişi yüklenirken hata:", e);
        localStorage.removeItem(HISTORY_STORAGE_KEY); // Hatalı veriyi temizle
        return []; // Boş array döndür
    }
}

function saveConversations(conversations) {
    // conversations'ın bir array olduğundan emin olalım
    if (!Array.isArray(conversations)) {
        console.error("Kaydedilecek veri bir dizi değil:", conversations);
        return;
    }
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
        console.error("Sohbet geçmişi kaydedilirken hata:", e);
        // Burada depolama alanı doluysa uyarı verilebilir
        if (e.name === 'QuotaExceededError') {
             alert("Tarayıcı depolama alanı dolu. Eski sohbetler kaydedilemiyor olabilir.");
        }
    }
}

function saveCurrentConversation() {
    // Mevcut konuşma boşsa veya sadece ilk bot mesajını içeriyorsa kaydetme
    if (!currentConversation || currentConversation.length === 0 || (currentConversation.length === 1 && currentConversation[0].role === 'bot')) {
        // console.log("Kaydedilecek anlamlı mesaj yok, atlanıyor.");
        return;
    }

    // Basit bir ID olarak timestamp kullanılıyor (daha sağlam bir ID sistemi düşünülebilir)
    const chatId = `chat_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const title = generateConversationTitle(currentConversation);

    const conversations = loadConversations();

    // Aynı ID ile zaten kayıtlı bir sohbet var mı diye kontrol et (çok düşük ihtimal ama)
    if (conversations.some(c => c.id === chatId)) {
        console.warn("Çakışan Sohbet ID'si tespit edildi, kaydetme atlanıyor:", chatId);
        return;
    }

    // Yeni sohbeti en başa ekle
    conversations.unshift({ id: chatId, title: title, messages: JSON.parse(JSON.stringify(currentConversation)) }); // Deep copy

    // Geçmişi belli bir sayıda tutmak isterseniz (örneğin son 50 sohbet)
    const MAX_HISTORY = 50;
    if (conversations.length > MAX_HISTORY) {
        conversations.length = MAX_HISTORY; // Sadece ilk 50'yi tut (unshift ile eklediğimiz için sondakiler silinir)
    }

    saveConversations(conversations);
    displayHistory(); // Sidebar'ı yenile
    // Yeni sohbet kaydedildiği için sidebar'da seçili olmamalı
    highlightSelectedChat(null);
    // console.log("Mevcut sohbet kaydedildi:", chatId);
}


function generateConversationTitle(conversation) {
    if (!conversation || conversation.length === 0) return "Boş Sohbet";

    const firstUserMessage = conversation.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.text) {
        const text = firstUserMessage.text.trim();
        return text.length > 30 ? text.substring(0, 27) + '...' : text; // Kısaltma
    }

    const firstMeaningfulBotMessage = conversation.find(msg => msg.role === 'bot' && !msg.text.includes('Merhaba!'));
    const targetBotMessage = firstMeaningfulBotMessage || conversation.find(msg => msg.role === 'bot');
    if(targetBotMessage && targetBotMessage.text){
        const text = targetBotMessage.text.replace('SibelGPT:', '').trim();
        return "Bot: " + (text.length > 25 ? text.substring(0, 22) + '...' : text); // Kısaltma
    }

    return "Yeni Sohbet Başlığı";
}


function clearChat() {
    if (!chatBox) return; // Henüz yüklenmediyse çık
    chatBox.innerHTML = ''; // Tüm mesajları sil

    // HTML'den gelen ilk bot mesajını tekrar ekle
    const initialBotMessageDiv = document.createElement("div");
    initialBotMessageDiv.className = "message bot-message";
    initialBotMessageDiv.innerHTML = `<strong>SibelGPT:</strong> Merhaba!SibelGPT, Sibel Kazan Midilli tarafından geliştirilen, yapay zeka destekli bir dijital danışmandır.Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın! .`;
    chatBox.appendChild(initialBotMessageDiv);

    // Mevcut sohbeti sadece bu ilk mesajla başlat
    currentConversation = [{ sender: 'SibelGPT', text: initialBotMessageDiv.textContent.replace('SibelGPT:', '').trim(), role: 'bot' }];

    highlightSelectedChat(null); // Sidebar vurgusunu kaldır
    if (userInput) userInput.focus(); // Input'a odaklan
}


function displayHistory() {
    if (!historyList) return; // Henüz yüklenmediyse çık
    const conversations = loadConversations();
    historyList.innerHTML = ''; // Önce listeyi temizle

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
        listItem.textContent = conv.title || "Başlıksız Sohbet";
        listItem.setAttribute('data-chat-id', conv.id);
        // Tıklama olayı artık delegation ile yönetiliyor, burada eklemeye gerek yok
        historyList.appendChild(listItem);
    });
}


function loadConversation(chatId) {
    if (!chatBox) return; // Henüz yüklenmediyse çık

    // Mevcut sohbeti gerekirse kaydet (load etmeden önce)
    saveCurrentConversationIfNeeded(chatId);

    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId);

    if (conversationToLoad && Array.isArray(conversationToLoad.messages)) { // Mesajların array olduğunu kontrol et
        chatBox.innerHTML = ''; // ChatBox'ı temizle
        currentConversation = []; // Geçici olarak sıfırla

        conversationToLoad.messages.forEach(msg => {
            // Mesaj formatı kontrolü
            if (msg && msg.sender && typeof msg.text === 'string' && msg.role) {
                 appendMessage(msg.sender, msg.text, msg.role, false); // addToHistory = false
            } else {
                console.warn("Geçmişten hatalı formatta mesaj yüklendi, atlanıyor:", msg);
            }
        });

        // currentConversation'ı yüklenen sohbetle güncelle
        currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));

        highlightSelectedChat(chatId);
        if (userInput) userInput.focus(); // Yükledikten sonra inputa odaklan

    } else {
        console.error("Yüklenmek istenen sohbet bulunamadı veya mesajlar hatalı:", chatId);
        const errorMsg = document.createElement("div");
        errorMsg.className = "message bot-message";
        errorMsg.innerHTML = "<strong>SibelGPT:</strong> ❌ Seçili sohbet yüklenirken bir hata oluştu.";
        chatBox.appendChild(errorMsg);
        scrollToBottom();
    }
}

// Yardımcı fonksiyon: Gerekirse mevcut sohbeti kaydet
function saveCurrentConversationIfNeeded(loadingChatId) {
    // Henüz sohbet başlamadıysa veya sadece başlangıç mesajı varsa kaydetme
    if (!currentConversation || currentConversation.length === 0 || (currentConversation.length === 1 && currentConversation[0].role === 'bot')) {
       return;
    }

    // Yüklenmek istenen sohbet zaten mevcut sohbetse tekrar kaydetme
    // (Bunun için mevcut sohbetin ID'sini bilmemiz gerekir, şimdilik bu kontrol atlanıyor)
    // if (currentConversationId === loadingChatId) return;

    saveCurrentConversation(); // Yukarıdaki kontrollerden geçtiyse kaydet
}


function highlightSelectedChat(chatId) {
    if (!historyList) return;
    // Tüm 'selected' sınıflarını kaldır
    historyList.querySelectorAll('li').forEach(li => {
        li.classList.remove('selected');
    });

    // Eğer bir chatId varsa ve buna uygun eleman bulunuyorsa 'selected' sınıfını ekle
    if(chatId !== null){
        const selectedItem = historyList.querySelector(`li[data-chat-id="${chatId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
        }
    }
}


// --- Olay Dinleyicileri ve Başlangıç Kodları (Güncellendi) ---

window.addEventListener("load", () => {
  // Element referanslarını ata (try-catch içine almak daha sağlam olabilir)
  try {
      chatBox = document.getElementById("chat-box");
      userInput = document.getElementById("user-input");
      sendButton = document.querySelector(".chat-input button"); // Butonun varlığını kontrol et
      newChatButton = document.querySelector(".new-chat-button button");
      historyList = document.getElementById("history-list");
      splashScreen = document.getElementById("splash-screen");

      // Splash ekranı yönetimi
      if (splashScreen) { // splashScreen null değilse devam et
          const splashComputedStyle = getComputedStyle(splashScreen);
          if (splashComputedStyle.display === 'none' || splashComputedStyle.opacity == 0) {
              initializeChatInterface();
          } else {
               // Animasyon bitişini bekle
              splashScreen.addEventListener('animationend', () => {
                  splashScreen.style.opacity = 0; // Önce soluklaştır
                  setTimeout(() => {
                      splashScreen.style.display = "none"; // Sonra gizle
                      initializeChatInterface();
                  }, 500); // Opacity geçiş süresi kadar bekle
              }, { once: true }); // Sadece bir kez çalıştır
          }
      } else {
           // Splash ekranı yoksa doğrudan başlat
           initializeChatInterface();
      }


      // Kalıcı olay dinleyicileri (elementler varsa ekle)
      if (userInput) {
          userInput.addEventListener("keypress", handleInputKeyPress);
      } else { console.error("User input element not found!"); }

      if (sendButton) {
          // HTML'deki onclick="sendMessage()" KESİNLİKLE kaldırılmalı!
          sendButton.addEventListener("click", sendMessage);
      } else { console.error("Send button element not found!"); }

      if (newChatButton) {
          newChatButton.addEventListener("click", handleNewChat);
      } else { console.error("New chat button element not found!"); }

       // historyList için tıklama dinleyicisi initializeChatInterface içinde ekleniyor.

      // İlk hoş geldiniz mesajını currentConversation'a ekle (eğer chatBox varsa)
      if (chatBox && currentConversation.length === 0) {
          const initialBotMessageElement = chatBox.querySelector('.message.bot-message');
          if(initialBotMessageElement) {
              currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
          }
      }

  } catch (error) {
      console.error("Sayfa yüklenirken kritik bir hata oluştu:", error);
      // Kullanıcıya bir hata mesajı gösterilebilir
      document.body.innerHTML = "Uygulama yüklenirken bir hata oluştu. Lütfen sayfayı yenileyin veya daha sonra tekrar deneyin.";
  }

});


// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor...");
    if (!historyList) {
        console.error("History list element not found during initialization!");
        // Belki kullanıcıya bir uyarı gösterilebilir
    } else {
        displayHistory(); // Geçmiş sohbetleri yükle ve sidebar'da göster
        // Geçmiş listesine tıklama olayını burada ekleyelim (event delegation)
        historyList.addEventListener("click", handleHistoryClickDelegation);
    }

    if (userInput) {
        userInput.focus(); // Arayüz hazır olunca inputa odaklan
    }
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    // console.log("Yeni sohbet butonu tıklandı.");
    saveCurrentConversationIfNeeded(null); // Mevcut sohbeti gerekirse kaydet
    clearChat(); // Chat kutusunu temizle ve currentConversation'ı sıfırla
}

// Geçmiş listesi için Event Delegation ile tıklama yöneticisi
function handleHistoryClickDelegation(event) {
    // Tıklanan elemanın kendisi veya üst elemanlarından biri LI[data-chat-id] mi?
    const clickedElement = event.target.closest('li[data-chat-id]');

    if (clickedElement) {
        const chatId = clickedElement.getAttribute('data-chat-id');
        // console.log("Geçmiş sohbet yükleniyor:", chatId);
        loadConversation(chatId);
    }
}

// Sayfa kapatılmadan önce mevcut sohbeti kaydet (throttle/debounce eklenebilir)
window.addEventListener('beforeunload', () => {
    saveCurrentConversationIfNeeded(null);
});
