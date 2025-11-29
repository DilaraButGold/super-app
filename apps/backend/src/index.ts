import express, { Request, Response } from "express";
import cors from "cors";
import pool from "./db";
import http from "http";
import { Server } from "socket.io";

const app = express();
const port = 3001;


const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: "*", // Her yerden gelen bağlantıya izin ver (Mobil, Web vs.)
    },
});

app.use(cors());
app.use(express.json());

// --- SANAL KURYE SİMÜLASYONU (Kurye Simge) ---
// Başlangıç Konumu (Galata Kulesi civarı)
let courierLocation = {
    latitude: 41.0256,
    longitude: 28.9741,
};

// Her 3 saniyede bir kuryeyi biraz hareket ettir
setInterval(() => {
    // Enlem ve boylamı çok ufak değiştir (Yürüyormuş gibi)
    courierLocation = {
        latitude: courierLocation.latitude + (Math.random() - 0.5) * 0.0005,
        longitude: courierLocation.longitude + (Math.random() - 0.5) * 0.0005,
    };

    // 📡 TÜM TELEFONLARA YAYIN YAP (BROADCAST)
    // "courierLocation" adında bir olay (event) fırlatıyoruz
    io.emit("courierLocation", courierLocation);

    // Konsol çok kirlenmesin diye bu logu yorum satırına alabilirsin istersen
    console.log("📍 Kurye hareket etti:", courierLocation);
}, 3000);

// --- SOCKET BAĞLANTI OLAYLARI ---
io.on("connection", (socket) => {
    console.log("🔌 Yeni bir telefon bağlandı! ID:", socket.id);

    socket.on("disconnect", () => {
        console.log("❌ Bağlantı koptu:", socket.id);
    });
});

// --- API ROTALARI ---

app.get("/", (req, res) => {
    res.json({ message: "Backend & Socket.io Hazır! 🚀" });
});

// Login
app.post("/login", async (req: Request, res: Response): Promise<void> => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            res.status(401).json({ message: "Kullanıcı yok" });
            return;
        }
        const user = result.rows[0];
        if (password === user.password) {
            res.status(200).json({ success: true, message: "Giriş Başarılı", user });
        } else {
            res.status(401).json({ message: "Şifre hatalı" });
        }
    } catch (err) {
        res.status(500).json({ message: "Hata" });
    }
});

// Siparişleri Getir
app.get("/orders/:userId", async (req: Request, res: Response) => {
    const { userId } = req.params;
    try {
        const result = await pool.query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: "Siparişler çekilemedi" });
    }
});

// Sipariş Oluştur
app.post("/orders", async (req: Request, res: Response) => {
    const { user_id, item_name, amount } = req.body;
    try {
        // Status varsayılan olarak 'PENDING' atanır (DB ayarımız sayesinde)
        const result = await pool.query(
            'INSERT INTO orders (user_id, item_name, amount) VALUES ($1, $2, $3) RETURNING *',
            [user_id, item_name, amount]
        );
        res.status(201).json({ success: true, message: "Sipariş alındı", order: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: "Sipariş oluşturulamadı" });
    }
});

app.put("/orders/:orderId/status", async (req: Request, res: Response): Promise<void> => {
    const { orderId } = req.params;
    const { status } = req.body; // Örn: "PREPARING", "ON_THE_WAY", "DELIVERED"

    try {
        // 1. Veritabanını Güncelle
        const result = await pool.query(
            'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
            [status, orderId]
        );

        if (result.rows.length === 0) {
            res.status(404).json({ message: "Sipariş bulunamadı" });
            return;
        }

        const updatedOrder = result.rows[0];

        // "orderStatusUpdate" adında bir olay yayınlıyoruz.
        io.emit("orderStatusUpdate", {
            orderId: updatedOrder.id,
            status: updatedOrder.status,
            message: getStatusMessage(updatedOrder.status)
        });

        res.json({ success: true, order: updatedOrder });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Güncelleme başarısız" });
    }
});

// Yardımcı Fonksiyon: Statüye göre mesaj üretir
function getStatusMessage(status: string) {
    switch (status) {
        case "PREPARING": return "Siparişiniz hazırlanıyor! 👨‍🍳";
        case "ON_THE_WAY": return "Kurye yola çıktı! 🛵";
        case "DELIVERED": return "Afiyet olsun! Sipariş teslim edildi. 😋";
        default: return "Sipariş durumu güncellendi.";
    }
}

server.listen(port, () => {
    console.log(`📡 Server ve Socket.io yayında: http://localhost:${port}`);
});