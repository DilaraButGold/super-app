Super App - Real-Time Delivery Tracking

Super App, modern web ve mobil teknolojileri kullanılarak geliştirilmiş, gerçek zamanlı (real-time) bir sipariş ve kurye takip sistemidir.

Bu proje; Event-Driven (Olay Güdümlü) mimariyi, Microservices prensiplerini ve Containerization (Docker) teknolojilerini pratik bir senaryo üzerinde uygular.

 Mimari ve Teknolojiler

Proje Monorepo yapısında kurgulanmış olup aşağıdaki teknolojileri içerir:

Alan

Teknoloji

Açıklama

Mobile (Client)

React Native (Expo)

Cross-platform mobil uygulama.

Backend (API)

Node.js / Express

RESTful API ve İş Mantığı.

Real-Time

Socket.io

Canlı konum ve statü güncellemeleri (WebSocket).

Database

PostgreSQL

İlişkisel veri tabanı (Sipariş & Kullanıcı verileri).

Infrastructure

Docker

Veritabanı ve yönetim paneli konteynerizasyonu.

UI/UX

React Native Maps

Google Maps entegrasyonu ve özel marker yönetimi.

🚀 Özellikler

🔐 Kullanıcı Girişi: Güvenli login sistemi.

🗺️ Canlı Kurye Takibi: Kuryenin konumu WebSocket üzerinden anlık olarak haritada güncellenir (Long Polling kullanılmaz).

📦 Sipariş Yönetimi: Kullanıcı sipariş verebilir ve geçmiş siparişlerini görebilir.

🔔 Anlık Durum Bildirimleri: Restoran sipariş durumunu değiştirdiğinde (PENDING -> ON_THE_WAY), kullanıcı anında bildirim alır.

🎨 Dinamik UI: Sipariş durumuna göre renk değiştiren kartlar ve özel ikonlar.

🛠️ Kurulum ve Çalıştırma

Projeyi yerel ortamınızda çalıştırmak için aşağıdaki adımları izleyin.

1. Ön Gereksinimler

Node.js (v18+)

Docker Desktop

Expo Go (Telefonda test için) veya Android Emulator

2. Altyapıyı Ayağa Kaldır (Docker)

Veritabanını başlatmak için ana dizinde:

docker-compose up -d


Not: Veritabanı localhost:5432, Yönetim Paneli (Adminer) localhost:8080 adresinde çalışacaktır.

3. Backend'i Başlat

cd apps/backend
npm install
npm start


Server http://localhost:3001 adresinde çalışır.

4. Mobil Uygulamayı Başlat

Yeni bir terminalde:

cd apps/mobile
npm install
npx expo start


QR kodunu telefonunuzla okutun veya 'a' tuşuna basarak Android Emulator'de açın.

📡 API ve Socket Yapısı

Socket Events

connection: İstemci sunucuya bağlanır.

courierLocation: Sunucu -> İstemci (Canlı koordinat akışı).

orderStatusUpdate: Sunucu -> İstemci (Sipariş durum değişikliği tetikleyicisi).

REST Endpoints

POST /login: Kullanıcı girişi.

GET /orders/:userId: Geçmiş siparişler.

POST /orders: Yeni sipariş oluşturma.

PUT /orders/:orderId/status: Sipariş durumunu güncelleme (Restoran Paneli).

👨‍💻 Geliştirici Notları

Bu proje, modern yazılım geliştirme süreçlerinde "State Management", "Asynchronous Programming" ve "Real-Time Data Handling" konularını pekiştirmek amacıyla geliştirilmiştir.
