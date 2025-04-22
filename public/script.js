// Sohbet geçmişini Local Storage'da tutmak için anahtar
const HISTORY_STORAGE_KEY = 'sibelgpt_conversations';

// Şu anki sohbetin mesajlarını tutacak dizi
// Her mesaj { sender: 'Sen'/'SibelGPT', text: '...', role: 'user'/'bot' } formatında olacak
let currentConversation = [];

// DOM elementlerine referanslar (sayfa yüklendiğinde atanacak)
let chatBox;
let userInput;
let newChatButton;
let historyList;
let splashScreen;

// --- Mesaj Gönderme ve Alma Fonksiyonları ---

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

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
  // Güvenlik için textContent kullanıyoruz, eğer HTML içeriği gösterecekseniz innerHTML kullanırken dikkatli olun
  messageElem.innerHTML = `<strong>${sender}:</strong> ${text}`; // Şimdilik bold için innerHTML kullandık

  chatBox.appendChild(messageElem);

  // Yeni mesajı currentConversation'a ekle (eğer kaydetme isteniyorsa)
  if (addToHistory) {
      currentConversation.push({ sender, text, role });
  }


  // Chat kutusunu en alta kaydır
  // Küçük bir timeout, elemanın DOM'a eklenip boyutunun hesaplanması için bazen gerekli olabilir
  setTimeout(() => {
      chatBox.scrollTop = chatBox.scrollHeight;
  }, 100); // 100ms gecikme
}


// Klavyeden Enter tuşuna basıldığında mesaj gönderme
function handleInputKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Varsayılan Enter davranışını (yeni satır) engelle
        sendMessage();
    }
}


// --- Sohbet Geçmişi Fonksiyonları (Local Storage Tabanlı) ---

// Tüm kayıtlı sohbetleri Local Storage'dan yükler
function loadConversations() {
    const conversationsJson = localStorage.getItem(HISTORY_STORAGE_KEY);
    try {
        return conversationsJson ? JSON.parse(conversationsJson) : [];
    } catch (e) {
        console.error("Sohbet geçmişi yüklenirken hata:", e);
        return []; // Hata olursa boş dizi döndür
    }
}

// Sohbetleri Local Storage'a kaydeder
function saveConversations(conversations) {
    try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(conversations));
    } catch (e) {
        console.error("Sohbet geçmişi kaydedilirken hata:", e);
        // Local Storage dolu olabilir vb. Kullanıcıya bilgi verilebilir.
    }
}

// Mevcut sohbeti geçmişe kaydeder
function saveCurrentConversation() {
    // Eğer mevcut sohbet boşsa veya sadece ilk hoş geldiniz mesajını içeriyorsa kaydetme
    if (currentConversation.length <= 1) {
        return;
    }

    // Yeni bir sohbet ID'si oluştur (timestamp veya daha robust bir UUID kullanılabilir)
    const chatId = Date.now();
    const title = generateConversationTitle(currentConversation); // Sohbet için başlık oluştur

    // Kayıtlı sohbetleri yükle
    const conversations = loadConversations();

    // Mevcut sohbeti listeye ekle (en yeni üste gelebilir)
    conversations.unshift({ id: chatId, title: title, messages: currentConversation });

    // Sohbetleri kaydet
    saveConversations(conversations);

    // Geçmiş listesini yeniden çiz
    displayHistory();
}


// Bir sohbetten otomatik başlık oluşturur (örneğin ilk kullanıcı mesajının ilk 20 karakteri)
function generateConversationTitle(conversation) {
    if (!conversation || conversation.length === 0) {
        return "Boş Sohbet";
    }
    // İlk kullanıcı mesajını bul
    const firstUserMessage = conversation.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.text) {
        const text = firstUserMessage.text.trim();
        // İlk 30 karakteri al, kelime sınırında kes ve sonuna üç nokta ekle
        if (text.length > 30) {
             return text.substring(0, 30).split(' ').slice(0, -1).join(' ') + '...';
        }
        return text;
    }
    // Kullanıcı mesajı yoksa botun ilk mesajını kullan (veya varsayılan)
    const firstBotMessage = conversation.find(msg => msg.role === 'bot');
    if(firstBotMessage && firstBotMessage.text){
         const text = firstBotMessage.text.trim();
          if (text.length > 30) {
             return text.substring(0, 30).split(' ').slice(0, -1).join(' ') + '...';
        }
        return text;
    }
    return "Yeni Sohbet"; // Varsayılan başlık
}


// Chat kutusunu temizler ve başlangıç mesajını ekler
function clearChat() {
    chatBox.innerHTML = ''; // Tüm mesajları sil

    // Başlangıç hoş geldiniz mesajını tekrar ekle (isterseniz HTML'den kaldırıp buradan da ekleyebilirsiniz)
    // const initialMessage = document.createElement("div");
    // initialMessage.className = "message bot-message";
    // initialMessage.innerHTML = `<strong>SibelGPT:</strong> Merhaba! Size nasıl yardımcı olabilirim?...`;
    // chatBox.appendChild(initialMessage);

    // Mevcut sohbeti sıfırla
    currentConversation = [];
}


// Sidebar'daki geçmiş listesini günceller
function displayHistory() {
    const conversations = loadConversations();
    historyList.innerHTML = ''; // Mevcut listeyi temizle

    if (conversations.length === 0) {
        historyList.innerHTML = '<li>Henüz kaydedilmiş sohbet yok.</li>';
        // Bu placeholder öğesine tıklama olayını engellemek gerekebilir
        const placeholder = historyList.querySelector('li');
        if(placeholder) placeholder.style.cursor = 'default';
         return;
    }

    conversations.forEach(conv => {
        const listItem = document.createElement('li');
        listItem.textContent = conv.title;
        listItem.setAttribute('data-chat-id', conv.id); // Sohbet ID'sini data-* özniteliğinde sakla
        historyList.appendChild(listItem);
    });
}

// Geçmişten belirli bir sohbeti yükler ve chat kutusunda gösterir
function loadConversation(chatId) {
    const conversations = loadConversations();
    const conversationToLoad = conversations.find(conv => conv.id == chatId); // data-* öznitelikleri string döner

    if (conversationToLoad) {
        clearChat(); // Önce mevcut sohbeti temizle

        // Yüklenen sohbetin mesajlarını göster
        conversationToLoad.messages.forEach(msg => {
             // appendMessage'i burada addToHistory=false ile çağırıyoruz, çünkü sadece görüntülüyoruz, kaydetmiyoruz
            appendMessage(msg.sender, msg.text, msg.role, false);
        });

        // currentConversation'ı yüklenen sohbetin mesajlarıyla güncelle
        currentConversation = [...conversationToLoad.messages]; // Kopya oluşturarak ata

        // Yüklenen sohbeti sidebar'da vurgulayabilirsiniz (isteğe bağlı)
        highlightSelectedChat(chatId);

    } else {
        console.error("Yüklenmek istenen sohbet bulunamadı:", chatId);
        // Kullanıcıya hata mesajı gösterilebilir
    }
}

// Sidebar'da seçili sohbeti görsel olarak vurgular
function highlightSelectedChat(chatId) {
    // Önceki vurguları kaldır
    historyList.querySelectorAll('li').forEach(li => {
        li.classList.remove('selected');
    });

    // Yeni seçili öğeyi bul ve vurgula
    const selectedItem = historyList.querySelector(`li[data-chat-id="${chatId}"]`);
    if (selectedItem) {
        selectedItem.classList.add('selected');
    }
}


// --- Olay Dinleyicileri ve Başlangıç Kodları ---

// Sayfa tamamen yüklendiğinde çalışacak kod
window.addEventListener("load", () => {
  // Element referanslarını ata
  chatBox = document.getElementById("chat-box");
  userInput = document.getElementById("user-input");
  newChatButton = document.querySelector(".new-chat-button button");
  historyList = document.getElementById("history-list");
  splashScreen = document.getElementById("splash-screen");


  // Splash ekranını gizle
  // setTimeout(() => {
  //   splashScreen.style.opacity = 0;
  //   setTimeout(() => {
  //     splashScreen.style.display = "none";
  //   }, 1000); // fade-out süresi kadar gecikme
  // }, 4000); // splash toplam gösterim süresi

  // Splash ekranının bitişini dinleyerek sonraki işlemleri yap
  splashScreen.addEventListener('animationend', () => {
    splashScreen.style.opacity = 0;
     // Kısa bir gecikme daha ekleyerek opacity geçişinin tamamlanmasını bekle
    setTimeout(() => {
      splashScreen.style.display = "none";
      // Splash bittikten sonra ilk yapılacaklar
      initializeChatInterface();
    }, 100); // Küçük bir gecikme
  });

   // Eğer splash ekran animasyonu yoksa veya tamamlandıysa (sayfa yenileme vs.)
   // display özelliği hala 'flex' ise animasyon henüz bitmemiştir.
   // Eğer display 'none' ise veya opacity 0 ise, animasyon muhtemelen bitti varsayılabilir.
   // Ancak animationend en güvenli yoldur. Fallback olarak:
   if (getComputedStyle(splashScreen).opacity == 0 || getComputedStyle(splashScreen).display == 'none') {
        initializeChatInterface();
   }


  // Olay dinleyicilerini ekle
  userInput.addEventListener("keypress", handleInputKeyPress); // Enter tuşu dinleyicisi
  newChatButton.addEventListener("click", handleNewChat); // Yeni sohbet butonu
  historyList.addEventListener("click", handleHistoryClick); // Geçmiş listesi (event delegation)

   // Eğer HTML'de ilk hoş geldin mesajı varsa, onu currentConversation'a ekle
   // Bunu sadece sayfa ilk yüklendiğinde yapmak önemlidir, clearChat() fonksiyonunda yapmamak
   // Eğer clearChat() içinde yaparsak, her yeni sohbette geçmişe otomatik eklenir ve karışır.
   // HTML'deki mesajı bul ve currentConversation'a ekle (addToHistory=false ile, henüz kaydedilmeyecek)
   const initialBotMessageElement = chatBox.querySelector('.bot-message');
   if(initialBotMessageElement && initialBotMessageElement.textContent.includes('Merhaba! Size nasıl yardımcı olabilirim?')) {
       currentConversation.push({ sender: 'SibelGPT', text: initialBotMessageElement.textContent.replace('SibelGPT:', '').trim(), role: 'bot' });
   }
});

// Splash ekranı bittikten veya atlandıktan sonra arayüzü başlatan fonksiyon
function initializeChatInterface() {
    // Geçmiş sohbetleri yükle ve sidebar'da göster
    displayHistory();

    // Sayfa yüklendiğinde ilk sohbeti (varsa) otomatik yükleyebilir veya boş bırakabilirsiniz.
    // Şimdilik boş bırakıp kullanıcı etkileşimini bekleyelim.
    // Eğer en son konuşmayı yüklemek isterseniz:
    // const conversations = loadConversations();
    // if (conversations.length > 0) {
    //     loadConversation(conversations[0].id); // En son sohbeti yükle
    // }
}


// "Yeni Sohbet" butonu tıklama yöneticisi
function handleNewChat() {
    // Mevcut sohbeti kaydet (eğer boş değilse)
    saveCurrentConversation();

    // Chat kutusunu temizle ve yeni sohbete başla
    clearChat();

    // Geçmiş listesini yeniden çiz (yeni kaydedilen sohbeti göstermek için)
    // displayHistory(); // saveCurrentConversation içinde zaten çağrılıyor
}


// Geçmiş listesi tıklama yöneticisi (Event Delegation kullanıldı)
function handleHistoryClick(event) {
    const clickedElement = event.target;

    // Tıklanan elementin bir <li> öğesi olup olmadığını kontrol et
    // ve data-chat-id özniteliğine sahip olup olmadığını kontrol et (placeholder'ları elemek için)
    if (clickedElement.tagName === 'LI' && clickedElement.hasAttribute('data-chat-id')) {
        const chatId = clickedElement.getAttribute('data-chat-id');
        console.log("Geçmiş sohbet yükleniyor:", chatId);
        loadConversation(chatId);
    }
     // İsteğe bağlı: Tıklanan element bir <li> değilse veya data-chat-id yoksa bir şey yapma
}


// Sayfa kapatılmadan önce mevcut sohbeti kaydet
// Bu, kullanıcı sayfayı kapatırsa veya yenilerse son sohbetin kaybolmasını engeller.
window.addEventListener('beforeunload', () => {
    saveCurrentConversation();
});


// Sidebar'da seçili sohbetin stilini CSS'te tanımlayın:
/*
.history li.selected {
    background-color: rgba(255, 255, 255, 0.3);
    font-weight: bold; // Veya başka bir vurgu
    // İsteğe bağlı: border-left veya başka bir görsel işaretçi
}
*/
