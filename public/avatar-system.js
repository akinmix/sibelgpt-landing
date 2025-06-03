// avatar-system.js - Avatar Yönetim Modülü
class AvatarSystem {
    constructor() {
        this.isActive = false;
        this.permissionGranted = false;
        this.currentVideo = null;
        this.wrapper = null;
    }

    // Ses izni iste
    async requestPermission() {
        return new Promise((resolve) => {
            const modal = this.createPermissionModal(resolve);
            document.body.appendChild(modal);
        });
    }

    // İzin modal'ını oluştur
    createPermissionModal(callback) {
        const modal = document.createElement('div');
        modal.id = 'avatar-permission-modal';
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; 
                        background: rgba(0,0,0,0.8); z-index: 99999; 
                        display: flex; align-items: center; justify-content: center;">
                <div style="background: white; padding: 30px; border-radius: 15px; 
                           text-align: center; max-width: 400px; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                    <h3 style="color: #333; margin-top: 0;">🎬 Avatar Deneyimi</h3>
                    <p style="color: #666; margin: 15px 0;">Sibel Hanım'ın sesli avatar'ını oynatmak istiyor musunuz?</p>
                    <div style="margin-top: 20px;">
                        <button id="avatar-allow" style="margin: 5px; padding: 12px 20px; 
                                background: #1976d2; color: white; border: none; 
                                border-radius: 25px; cursor: pointer; font-size: 14px;">
                            🔊 Evet, Sesli Oynat
                        </button>
                        <button id="avatar-deny" style="margin: 5px; padding: 12px 20px; 
                                background: #757575; color: white; border: none; 
                                border-radius: 25px; cursor: pointer; font-size: 14px;">
                            🔇 Hayır, Sessiz
                        </button>
                    </div>
                </div>
            </div>
        `;

        // Buton olayları
        modal.querySelector('#avatar-allow').onclick = () => {
            this.permissionGranted = true;
            document.body.removeChild(modal);
            callback(true);
        };

        modal.querySelector('#avatar-deny').onclick = () => {
            this.permissionGranted = false;
            document.body.removeChild(modal);
            callback(false);
        };

        return modal;
    }

    // Avatar'ı göster
    async show() {
        // İzin verilmemişse sor
        if (this.permissionGranted === null) {
            await this.requestPermission();
        }

        this.wrapper = document.getElementById('loading-video-wrapper');
        this.currentVideo = document.getElementById('loading-video');

        if (this.wrapper && this.currentVideo) {
            this.isActive = true;
            document.body.classList.add('avatar-showing');
            this.wrapper.style.display = 'flex';
            
            this.currentVideo.currentTime = 0;
            this.currentVideo.muted = !this.permissionGranted;

            try {
                await this.currentVideo.play();
                console.log(`🎬 Avatar başlatıldı (${this.currentVideo.muted ? 'sessiz' : 'sesli'})`);
                
                // 28 saniye sonra otomatik kapat
                setTimeout(() => {
                    if (this.isActive) this.hide();
                }, 28000);

                // Video bitince kapat
                this.currentVideo.onended = () => {
                    if (this.isActive) this.hide();
                };

            } catch (error) {
                console.warn('🎬 Avatar oynatma hatası:', error);
                this.hide();
            }
        }
    }

    // Avatar'ı gizle
    hide() {
        if (this.wrapper && this.currentVideo) {
            this.currentVideo.pause();
            this.wrapper.style.display = 'none';
            document.body.classList.remove('avatar-showing');
            this.isActive = false;
            console.log('🎬 Avatar gizlendi');
        }
    }

    // Aktif mi kontrol et
    isShowing() {
        return this.isActive;
    }
}

// Global avatar instance
window.avatarSystem = new AvatarSystem();
