// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

// Şu anki sohbetin mesajlarını tutacak dizi
let currentConversation = []; // Başlangıçta boş, ilk mesaj eklendiğinde dolacak

// DOM elementlerine referanslar (sayfa yüklendiğinde atanacak)
let chatBox;
let userInput;
let newChatButton;
let historyList;
let splashScreen;

// Animasyon değişkenleri ÇIKARTILDI


// --- Mesaj Gönderme ve Alma Fonksiyonları ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  // Animasyon durdurma çağrısı ÇIKARTILDI

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

    const data = await response.json();
    const reply = data.reply || "❌ Bir hata oluştu. Lütfen tekrar deneyin.";

    appendMessage("SibelGPT", reply, "bot", true); // true: geçmişe ekle

  } catch (error) {
    appendMessage("SibelGPT", "❌ Bir hata oluştu. Sunucuya ulaşılamıyor.", "bot", true); // true: geçmişe ekle
    console.error("Mesaj gönderirken hata:", error);
  }
}

function appendMessage(sender, text, role, addToHistory = false) {
  const messageElem = document.createElement("div");
  messageElem.className = "message " + role;
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`; // Güvenlik için textContent düşünülmeli, ama bold için innerHTML kalabilir

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
// Bu fonksiyonlar animasyon logic'inden bağımsız, olduğu gibi kaldı

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
    // Sadece welcome mesajı varsa kaydetme
    if (currentConversation.length <= 1 && currentConversation[0] && currentConversation[0].role === 'bot' && currentConversation[0].text.includes('Merhaba!')) {
        return;
    }
     // Eğer hiç mesaj yoksa da kaydetme
     if (currentConversation.length === 0) {
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
    chatBox.innerHTML = ''; // Tüm mesajları sil
    currentConversation = []; // Mevcut sohbeti sıfırla
    // clearChat artık welcome mesajını eklemiyor, HTML'den geliyor
    highlightSelectedChat(null); // Sidebar vurgusunu kaldır
    // Animasyon oynatma çağrısı ÇIKARTILDI
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
        chatBox.innerHTML = ''; // Yüklerken chatBox'ı temizle
        currentConversation = []; // currentConversation'ı sıfırla

        conversationToLoad.messages.forEach((msg, index) => {
             // Welcome mesajını HTML'den geldiği için tekrar eklemiyoruz.
             // Yüklenen sohbetteki tüm mesajları (welcome dahil) append ediyoruz.
             appendMessage(msg.sender, msg.text, msg.role, false); // Sadece göster
         });

        // currentConversation'ı yüklenen sohbetin mesajlarıyla güncelle
        currentConversation = JSON.parse(JSON.stringify(conversationToLoad.messages));

        highlightSelectedChat(chatId);
        // Animasyon durdurma çağrısı ÇIKARTILDI
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


// Animasyon fonksiyonları ÇIKARTILDI
// stopInitialAnimation, playInitialAnimation, handleAnimationContainerClick, stopInitialAnimationInstant, stopInitialAnimationOnEnterKey


// --- Olay Dinleyicileri ve Başlangıç Kodları ---

window.addEventListener("load", () => {
  // Element referanslarını ata
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");
  // Animasyon element referansları ÇIKARTILDI


  // Splash ekranının bitişini dinle veya zaten gizliyse başlat
  const splashComputedStyle = getComputedStyle(splashScreen);
  if (splashComputedStyle.opacity == 0 || splashComputedStyle.display == 'none') {
      initializeChatInterface();
  } else {
      splashScreen.addEventListener('animationend', () => {
        splashScreen.style.opacity = 0;
        setTimeout(() => {
          splashScreen.style.display = "none";
          initializeChatInterface(); // Splash bittikten sonra ilk yapılacaklar
        }, 100);
      });
  }

  // Olay dinleyicilerini ekle (genel olarak sayfa ömrü boyunca kalacaklar)
  userInput.addEventListener("keypress", handleInputKeyPress);
  newChatButton.addEventListener("click", handleNewChat);
  historyList.addEventListener("click", handleHistoryClick);
  // Animasyon tıklama dinleyicisi ÇIKARTILDI

  // Sayfa ilk yüklendiğinde (geçmiş yoksa veya yüklenmediyse) hoş geldiniz mesajı
  // currentConversation'a eklenmeli ve inputa odaklanmalı.
  // HTML'deki welcome mesajı zaten görünür durumda.
  // currentConversation'ı sadece welcome mesajıyla başlat
   const initialBotMessageElement = chatBox.querySelector('.bot-message');
   if(initialBotMessageElement) {
       currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
   }


  // Sayfa yüklendiğinde inputa odaklan
  setTimeout(() => {
       userInput.focus();
  }, 100);

  // Geçmişi göster (initializeChatInterface'a taşındı)
  initializeChatInterface(); // Sadece displayHistory'yi çağıracak şimdi
});


// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    console.log("Chat arayüzü başlatılıyor (animasyonsuz)...");
    displayHistory(); // Geçmiş sohbetleri yükle ve sidebar'da göster

    // Animasyon başlatma çağrısı ÇIKARTILDI
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    saveCurrentConversation(); // Mevcut sohbeti kaydet
    clearChat(); // Chat kutusunu temizle ve currentConversation'ı sıfırla

    console.log("Yeni sohbet başlatıldı.");

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
            // Geçmiş yüklenince chatBox temizlenir, welcome mesajı eklenir (HTML'den geliyor).
            // Yüklü mesajlar append edilir.
            loadConversation(chatId); // loadConversation içinde saveCurrentConversation var
         }
         userInput.focus();
    }
}


// Sayfa kapatılmadan önce mevcut sohbeti kaydet
window.addEventListener('beforeunload', () => {
    saveCurrentConversation();
});
