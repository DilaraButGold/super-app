import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet, Text, View, TextInput, TouchableOpacity, Alert,
  ActivityIndicator, Dimensions, FlatList, Image, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

// 📡 SOCKET İSTEMCİSİ
import io from 'socket.io-client';

const ICONS = {
  COURIER: '🛵',
  USER: '📍',
  FOOD: '🍔'
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [courierLocation, setCourierLocation] = useState(null);

  const [orders, setOrders] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Emülatör IP adresi (Android için 10.0.2.2, iOS için localhost)
  const API_URL = "http://10.0.2.2:3001";

  // --- YARDIMCI FONKSİYONLAR ---

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_URL}/orders/${user.id}`);
      const data = await res.json();
      setOrders(data);
    } catch (e) {
      console.log("Sipariş çekme hatası", e);
    }
  }, [user]);

  // Statüye göre renk ve metin dönen fonksiyon
  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return { color: '#FF9500', text: 'Hazırlanıyor', bg: '#FFF5E5' };
      case 'PREPARING':
        return { color: '#FF9500', text: 'Hazırlanıyor', bg: '#FFF5E5' };
      case 'ON_THE_WAY':
        return { color: '#007AFF', text: 'Yolda', bg: '#E5F1FF' };
      case 'DELIVERED':
        return { color: '#34C759', text: 'Teslim Edildi', bg: '#E8FAEB' };
      default:
        return { color: '#8E8E93', text: status, bg: '#F2F2F7' };
    }
  };



  useEffect(() => {
    if (isLoggedIn) {
      const newSocket = io(API_URL);
      console.log("📡 Socket bağlantısı başlatılıyor...");

      newSocket.on("courierLocation", (coords) => {
        setCourierLocation(coords);
      });

      newSocket.on("orderStatusUpdate", (data) => {
        console.log("🔔 Statü değişti:", data);
        Alert.alert("📢 Sipariş Güncellemesi", data.message);
        fetchOrders();
      });

      return () => newSocket.disconnect();
    }
  }, [isLoggedIn, fetchOrders]);

  useEffect(() => {
    if (isLoggedIn) {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setUserLocation(loc.coords);
      })();
      fetchOrders();
    }
  }, [isLoggedIn, fetchOrders]);


  const handlePlaceOrder = async () => {
    try {
      await fetch(`${API_URL}/orders`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, item_name: "Süper Burger Menü 🍔", amount: 250 })
      });
      Alert.alert("Sipariş Alındı! 🎉", "Restoran siparişini hazırlamaya başladı.");
      fetchOrders();
    } catch (e) {
      Alert.alert("Hata", "Sipariş oluşturulamadı");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Eksik Bilgi", "Lütfen email ve şifre girin.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        setIsLoggedIn(true);
      } else { Alert.alert("Hata", data.message); }
    } catch (e) { Alert.alert("Bağlantı Hatası", "Backend sunucusu çalışıyor mu?"); }
    setLoading(false);
  };

  // --- EKRANLAR ---

  if (isLoggedIn) {
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          region={{
            latitude: courierLocation?.latitude || userLocation?.latitude || 41.0082,
            longitude: courierLocation?.longitude || userLocation?.longitude || 28.9784,
            latitudeDelta: 0.015, longitudeDelta: 0.015,
          }}
          showsUserLocation={true}
        >
          {/* 🛵 ÖZEL KURYE İKONU */}
          {courierLocation && (
            <Marker coordinate={courierLocation} title="Kurye Simge">
              <View style={styles.markerContainer}>
                <Text style={styles.markerEmoji}>{ICONS.COURIER}</Text>
              </View>
            </Marker>
          )}
        </MapView>

        {/* 📱 SİPARİŞ PANELİ */}
        <View style={styles.panel}>
          <View style={styles.panelHandle} />
          <Text style={styles.panelTitle}>Sipariş Durumu</Text>

          <TouchableOpacity style={styles.mainButton} onPress={handlePlaceOrder}>
            <Text style={styles.mainButtonText}>🍔 Hemen Sipariş Ver (250₺)</Text>
          </TouchableOpacity>

          <FlatList
            data={orders}
            keyExtractor={item => item.id.toString()}
            style={styles.list}
            renderItem={({ item }) => {
              const badge = getStatusBadge(item.status);
              return (
                <View style={styles.card}>
                  <View style={styles.cardIcon}>
                    <Text style={{ fontSize: 24 }}>{ICONS.FOOD}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle}>{item.item_name}</Text>
                    <Text style={styles.cardPrice}>{item.amount}₺</Text>
                  </View>
                  {/* RENKLİ STATÜ ROZETİ */}
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.text}</Text>
                  </View>
                </View>
              );
            }}
          />

          <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={styles.logoutBtn}>
            <Text style={styles.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // --- LOGIN EKRANI ---
  return (
    <SafeAreaView style={styles.loginContainer}>
      <View style={styles.loginCard}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>⚡</Text>
        </View>
        <Text style={styles.appTitle}>Super App</Text>
        <Text style={styles.appSubtitle}>Hızlı Teslimat, Mutlu Müşteri</Text>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-Posta</Text>
          <TextInput
            style={styles.input}
            placeholder="admin@superapp.com"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Şifre</Text>
          <TextInput
            style={styles.input}
            placeholder="******"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Giriş Yap</Text>}
        </TouchableOpacity>
      </View>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Genel
  container: { flex: 1, backgroundColor: '#fff' },
  map: { flex: 1 },

  // Marker
  markerContainer: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#007AFF',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  markerEmoji: { fontSize: 24 },

  // Panel
  panel: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    height: '45%'
  },
  panelHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#E5E5EA',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 15
  },
  panelTitle: { fontSize: 20, fontWeight: '700', color: '#1C1C1E', marginBottom: 15 },

  // Butonlar
  mainButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  mainButtonText: { color: 'white', fontSize: 16, fontWeight: '600' },

  // Liste Kartı
  list: { flex: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F2F2F7',
  },
  cardIcon: {
    width: 40,
    height: 40,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1C1C1E' },
  cardPrice: { fontSize: 14, color: '#8E8E93', marginTop: 2 },

  // Rozet (Badge)
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: { fontSize: 12, fontWeight: '700' },

  logoutBtn: { alignSelf: 'center', marginTop: 10, padding: 10 },
  logoutText: { color: '#FF3B30', fontWeight: '600' },

  // Login Ekranı
  loginContainer: { flex: 1, backgroundColor: '#F2F2F7', justifyContent: 'center', padding: 20 },
  loginCard: {
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10
  },
  logoContainer: {
    width: 80, height: 80, backgroundColor: '#FFD60A', borderRadius: 24,
    alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 20,
    transform: [{ rotate: '-10deg' }]
  },
  logoIcon: { fontSize: 40 },
  appTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#1C1C1E', marginBottom: 5 },
  appSubtitle: { fontSize: 15, textAlign: 'center', color: '#8E8E93', marginBottom: 30 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 13, fontWeight: '600', color: '#8E8E93', marginBottom: 8, marginLeft: 4 },
  input: {
    backgroundColor: '#F2F2F7', borderRadius: 12, padding: 16, fontSize: 16, color: '#1C1C1E'
  },
  loginButton: {
    backgroundColor: '#1C1C1E', paddingVertical: 18, borderRadius: 14, marginTop: 10, alignItems: 'center'
  },
  loginBtnText: { color: 'white', fontSize: 16, fontWeight: '700' }
});