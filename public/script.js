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
  if (!message) return;

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

    // -------- YAZIYOR ANIMASYONU KALDIRMA (cevap gelince) --------
    // hideTypingIndicator(); // Finally bloğuna taşıdık

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";

    // Gerçek cevabı eklemeden ÖNCE animasyonu kaldırdığımızdan emin olmalıyız (finally yapar)
    appendMessage("SibelGPT", reply, "bot", true); // true: geçmişe ekle

  } catch (error) {
    // -------- YAZIYOR ANIMASYONU KALDIRMA (hata olunca) --------
    // hideTypingIndicator(); // Finally bloğuna taşıdık

    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot", true); // true: geçmişe ekle
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

  // ---- DİKKAT: Typing indicator eklerken bu fonksiyon kullanılmayacak ----
  // Çünkü indicator'ın içeriği farklı (noktalar var, strong tag yok vs.)
  // Sadece gerçek user ve bot mesajları için kullanılıyor.
  if (role !== 'typing-indicator') { // Bu kontrol aslında gereksiz çünkü indicator'ı ayrı fonksiyon ekliyor
      messageElem.className = "message " + role + "-message"; // Sınıf adını düzeltelim (user-message, bot-message)
      // Güvenlik Notu: Kullanıcıdan veya API'den gelen veriyi doğrudan innerHTML'e basmak
      // Cross-Site Scripting (XSS) açıklarına yol açabilir.
      // Eğer API cevabı veya kullanıcı girdisi HTML içermiyorsa textContent kullanmak daha güvenlidir.
      // Şimdilik bold tag için innerHTML kalıyor, ama dikkatli olunmalı.
      messageElem.innerHTML = `<strong>${sender}:</strong> `; // Önce gönderen
      const textNode = document.createTextNode(text); // Sonra metni güvenli ekle
      messageElem.appendChild(textNode);
  } else {
     // Bu kısım artık showTypingIndicator fonksiyonunda ele alınıyor.
     // messageElem.className = "message bot-message typing-indicator";
     // // Noktaları ekleme mantığı showTypingIndicator içinde...
  }


  chatBox.appendChild(messageElem);

  if (addToHistory && role !== 'typing-indicator') { // Indicator'ı geçmişe ekleme
     currentConversation.push({ sender, text, role });
  }

  // Mesaj eklendikten sonra en alta kaydır
  scrollToBottom();
}

// Sohbet kutusunu en alta kaydıran yardımcı fonksiyon
function scrollToBottom() {
    // Kısa bir gecikme, eleman DOM'a eklendikten sonra scroll yapar
    setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
    }, 50); // 100ms biraz uzun olabilir, 50ms deneyelim
}


function handleInputKeyPress(event) {
    // Eğer input pasifse Enter'a basılmasını engelle
    if (userInput.disabled) {
        event.preventDefault();
        return;
    }
    if (event.key === 'Enter') {
        event.preventDefault();
        sendMessage();
    }
}


// --- Sohbet Geçmişi Fonksiyonları (Local Storage Tabanlı) ---
// Bu fonksiyonlarda değişiklik yok, öncekiyle aynı...

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
    // Sadece welcome mesajı varsa veya hiç mesaj yoksa kaydetme
    if (currentConversation.length === 0 || (currentConversation.length === 1 && currentConversation[0].role === 'bot' && currentConversation[0].text.includes('Merhaba!'))) {
        return;
    }

    const chatId = Date.now(); // Basit ID olarak timestamp kullanılıyor
    const title = generateConversationTitle(currentConversation);

    const conversations = loadConversations();

    // Aynı sohbetin tekrar tekrar kaydedilmesini önlemek için basit bir kontrol eklenebilir (isteğe bağlı)
    // Örn: const existingConv = conversations.find(c => c.id === currentConversationId); if(existingConv) ...

    conversations.unshift({ id: chatId, title: title, messages: currentConversation });

    // Geçmişi belli bir sayıda tutmak isterseniz burada slice() yapabilirsiniz
    // const MAX_HISTORY = 20;
    // if (conversations.length > MAX_HISTORY) {
    //     conversations = conversations.slice(0, MAX_HISTORY);
    // }

    saveConversations(conversations);
    displayHistory(); // Geçmişi güncelledikten sonra sidebar'ı yenile
}


function generateConversationTitle(conversation) {
    if (!conversation || conversation.length === 0) {
        return "Boş Sohbet";
    }
    // İlk kullanıcı mesajını bul
    const firstUserMessage = conversation.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.text) {
        const text = firstUserMessage.text.trim();
        // Başlığı kısaltma mantığı
        if (text.length > 30) {
            const trimmedText = text.substring(0, 30);
            const lastSpaceIndex = trimmedText.lastIndexOf(' ');
            // Eğer son kelime çok kısaysa veya boşluk yoksa direkt kes
            if (lastSpaceIndex > 10) {
                return trimmedText.substring(0, lastSpaceIndex) + '...';
            }
            return trimmedText + '...';
        }
        return text; // 30 karakterden kısaysa olduğu gibi döndür
    }
    // Kullanıcı mesajı yoksa ilk bot mesajını kullan (Hoşgeldin mesajı hariç tutulabilir)
    const firstMeaningfulBotMessage = conversation.find(msg => msg.role === 'bot' && !msg.text.includes('Merhaba!'));
    const targetBotMessage = firstMeaningfulBotMessage || conversation.find(msg => msg.role === 'bot'); // Bulamazsa herhangi bir bot mesajı

    if(targetBotMessage && targetBotMessage.text){
        const text = targetBotMessage.text.replace('SibelGPT:', '').trim();
         // Başlığı kısaltma mantığı
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
    return "Yeni Sohbet"; // Hiç anlamlı mesaj yoksa
}


function clearChat() {
    chatBox.innerHTML = ''; // Tüm mesajları sil
    // HTML'den gelen ilk bot mesajını tekrar ekle
    const initialBotMessageDiv = document.createElement("div");
    initialBotMessageDiv.className = "message bot-message";
    initialBotMessageDiv.innerHTML = `<strong>SibelGPT:</strong> Merhaba!SibelGPT, Sibel Kazan Midilli tarafından geliştirilen, yapay zeka destekli bir dijital danışmandır.Gayrimenkul yatırımlarınız, numerolojik analizleriniz ve finansal kararlarınızda size rehberlik eder. SibelGPT ile hem aklınızı hem ruhunuzu besleyen kararlar alın! .`;
    chatBox.appendChild(initialBotMessageDiv);

    // Mevcut sohbeti sadece bu ilk mesajla başlat
    currentConversation = [{ sender: 'SibelGPT', text: initialBotMessageDiv.textContent.replace('SibelGPT:', '').trim(), role: 'bot' }];

    highlightSelectedChat(null); // Sidebar vurgusunu kaldır
    userInput.focus(); // Input'a odaklan
}


function displayHistory() {
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
        listItem.textContent = conv.title || "Başlıksız Sohbet"; // Başlık yoksa varsayılan
        listItem.setAttribute('data-chat-id', conv.id);
        listItem.addEventListener('click', handleHistoryItemClick); // Tıklama olayını ekle
        historyList.appendChild(listItem);
    });
}

// Geçmişten sohbet yükleme fonksiyonu
function loadConversation(chatId) {
    // Mevcut sohbet farklıysa ve boş değilse kaydet
    // (Kendi üzerine tekrar tıklayınca kaydetmemek için kontrol eklenebilir)
     saveCurrentConversationIfNeeded(chatId); // Yeni yardımcı fonksiyon

    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId); // == yerine === kullanmak daha güvenli ama id tipine bağlı

    if (conversationToLoad) {
        chatBox.innerHTML = ''; // ChatBox'ı temizle
        currentConversation = []; // Geçici olarak sıfırla

        conversationToLoad.messages.forEach(msg => {
            // addToHistory = false olmalı ki tekrar geçmişe eklenmesin
            appendMessage(msg.sender, msg.text, msg.role, false);
        });

        // currentConversation'ı yüklenen sohbetle güncelle (geçmişe ekleme flag'i önemli)
        currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));

        highlightSelectedChat(chatId);
        userInput.focus(); // Yükledikten sonra inputa odaklan

    } else {
        console.error("Yüklenmek istenen sohbet bulunamadı:", chatId);
        // Hata mesajını sadece chatBox'a ekle, currentConversation'ı değiştirme
        const errorMsg = document.createElement("div");
        errorMsg.className = "message bot-message";
        errorMsg.innerHTML = "<strong>SibelGPT:</strong> ❌ Bu sohbet yüklenirken bir hata oluştu.";
        chatBox.appendChild(errorMsg);
        scrollToBottom();
    }
}

// Yardımcı fonksiyon: Gerekirse mevcut sohbeti kaydet
function saveCurrentConversationIfNeeded(loadingChatId) {
    // Eğer currentConversation boşsa veya sadece ilk mesajı içeriyorsa kaydetme
    if (currentConversation.length === 0 || (currentConversation.length === 1 && currentConversation[0].role === 'bot' && currentConversation[0].text.includes('Merhaba!'))) {
       return;
    }
    // Eğer yüklenmek istenen ID ile mevcut sohbetin ID'si aynıysa kaydetme (ID takibi eklenirse)
    // if (currentConversationId === loadingChatId) return; // currentConversationId takibi gerekir

    // Diğer durumlarda kaydet
    saveCurrentConversation();
}


function highlightSelectedChat(chatId) {
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
  // Element referanslarını ata
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  // Gönder butonunu seç (HTML'deki butona ID vermek daha sağlam olabilir)
  sendButton = document.querySelector(".chat-input button");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");

  // Splash ekranı yönetimi
  const splashComputedStyle = getComputedStyle(splashScreen);
  if (splashComputedStyle.opacity == 0 || splashComputedStyle.display == 'none') {
      initializeChatInterface();
  } else {
      splashScreen.addEventListener('animationend', () => {
          splashScreen.style.opacity = 0;
          setTimeout(() => {
              splashScreen.style.display = "none";
              initializeChatInterface(); // Splash bittikten sonra arayüzü başlat
          }, 500); // Opacity geçişi için süre
      }, { once: true }); // Olay dinleyicisinin sadece bir kez çalışmasını sağla
  }

  // Kalıcı olay dinleyicileri
  userInput.addEventListener("keypress", handleInputKeyPress);
  // Gönder butonuna tıklama olayını da ekleyelim (onclick yerine)
  if(sendButton) { // Butonun varlığını kontrol et
      sendButton.addEventListener("click", sendMessage);
      // HTML'deki onclick="sendMessage()" kısmını kaldırabilirsiniz,
      // çünkü artık buradan ekliyoruz. Çift dinleyici olmasın.
  }
  newChatButton.addEventListener("click", handleNewChat);
  // historyList için tıklama yöneticisi initializeChatInterface içinde eklenecek
  // çünkü liste içeriği dinamik olarak yükleniyor.

  // İlk hoş geldiniz mesajını currentConversation'a ekle
  const initialBotMessageElement = chatBox.querySelector('.message.bot-message');
   if(initialBotMessageElement && currentConversation.length === 0) { // Sadece başlangıçta ekle
       currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
   }

  // Başlangıçta inputa odaklanma initializeChatInterface'e taşındı
});


// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor...");
    displayHistory(); // Geçmiş sohbetleri yükle ve sidebar'da göster
    // Geçmiş listesine tıklama olayını burada ekleyelim (event delegation)
    historyList.addEventListener("click", handleHistoryClickDelegation);

    userInput.focus(); // Arayüz hazır olunca inputa odaklan
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    saveCurrentConversationIfNeeded(null); // Mevcut sohbeti gerekirse kaydet
    clearChat(); // Chat kutusunu temizle ve currentConversation'ı sıfırla
    console.log("Yeni sohbet başlatıldı.");
}

// Geçmiş listesi için Event Delegation ile tıklama yöneticisi
function handleHistoryClickDelegation(event) {
    const clickedElement = event.target.closest('li[data-chat-id]'); // Tıklanan LI'yı bul

    if (clickedElement) {
        const chatId = clickedElement.getAttribute('data-chat-id');
        console.log("Geçmiş sohbet yükleniyor:", chatId);
        loadConversation(chatId);
    }
}

// Eski handleHistoryItemClick fonksiyonu kaldırıldı, yerine delegation kullanıldı.


// Sayfa kapatılmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
    // Çok kısa veya sadece başlangıç mesajı içerenleri kaydetme
    saveCurrentConversationIfNeeded(null);
});
