// trading-widgets.js
// SibelGPT TradingView Widget Manager

class TradingWidgetManager {
    constructor() {
        this.bannerContainer = null;
        this.widgetData = null;
        this.updateInterval = null;
    }

    // Banner'ı oluştur ve göster
    async showFinanceBanner() {
        console.log('📊 Finans banner aktif ediliyor...');
        
        // Banner container'ı oluştur
        this.createBannerContainer();
        
        // Widget verilerini al
        await this.loadWidgetData();
        
        // Banner'ı güncelle
        this.updateBanner();
        
        // Banner'ı göster
        this.bannerContainer.style.display = 'block';
        
        // Auto-refresh başlat (30 saniyede bir)
        this.startAutoRefresh();
    }

    // Banner'ı gizle
    hideFinanceBanner() {
        console.log('📊 Finans banner gizleniyor...');
        
        if (this.bannerContainer) {
            this.bannerContainer.style.display = 'none';
        }
        
        // Auto-refresh durdur
        this.stopAutoRefresh();
    }

    // Banner HTML container'ını oluştur
    createBannerContainer() {
        // Eğer zaten varsa silme
        if (this.bannerContainer) {
            return;
        }

        // Banner HTML
        const bannerHTML = `
            <div id="finance-banner" class="finance-banner">
                <div class="banner-content">
                    <span class="banner-title">📊 PIYASA ÖZETİ</span>
                    <div class="banner-tickers" id="banner-tickers">
                        <span class="ticker-loading">Yükleniyor...</span>
                    </div>
                </div>
            </div>
        `;

        // Chat container'ın üstüne ekle
        const chatContainer = document.querySelector('.center-chat-container');
        if (chatContainer) {
            chatContainer.insertAdjacentHTML('beforebegin', bannerHTML);
            this.bannerContainer = document.getElementById('finance-banner');
        }
    }

    // Widget verilerini backend'den al
    async loadWidgetData() {
        try {
            const response = await fetch('https://sibelgpt-backend.onrender.com/test-trading-widget');
            const data = await response.json();
            
            if (data.status === 'success') {
                this.widgetData = data.config;
                console.log('✅ Widget verileri yüklendi:', this.widgetData);
            }
        } catch (error) {
            console.error('❌ Widget veri yükleme hatası:', error);
        }
    }

    // Banner içeriğini güncelle
    updateBanner() {
        const tickersContainer = document.getElementById('banner-tickers');
        if (!tickersContainer || !this.widgetData) return;

        // Sembolleri banner formatında göster
        const symbols = this.widgetData.symbols;
        const tickerHTML = symbols.map(symbol => {
            return `<span class="ticker-item">${symbol.description}</span>`;
        }).join(' | ');

        tickersContainer.innerHTML = tickerHTML;
    }

    // Otomatik yenileme başlat
    startAutoRefresh() {
        this.updateInterval = setInterval(() => {
            this.loadWidgetData().then(() => {
                this.updateBanner();
            });
        }, 30000); // 30 saniye
    }

    // Otomatik yenileme durdur
    stopAutoRefresh() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }
}

// Global trading widget manager
window.tradingWidgetManager = new TradingWidgetManager();

// Export fonksiyonları
window.showFinanceBanner = () => window.tradingWidgetManager.showFinanceBanner();
window.hideFinanceBanner = () => window.tradingWidgetManager.hideFinanceBanner();

console.log('✅ Trading Widgets JS yüklendi');
