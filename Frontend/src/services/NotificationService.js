import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import api from './ApiService';

// Bildirimlerin uygulama açıkken nasıl davranacağını belirler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Kullanıcıdan bildirim izni ister, token'ı alır ve backend'e kaydeder.
 */
export async function registerForPushNotificationsAsync() {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
        console.log("Bildirim izni verilmedi veya reddedildi.");
        return finalStatus; // -> Artık 'false' yerine durumun kendisini döndürüyoruz
    }
    
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Expo Push Token:", token);

    try {
        await api.post('/users/me/fcm-token', { token: token });
        console.log("FCM token başarıyla backend'e kaydedildi.");
        return true;
    } catch (error) {
        console.error("FCM token kaydedilirken hata oluştu:", error);
        return false;
    }
}


export async function unregisterFromPushNotificationsAsync() {
    try {
        await api.post('/users/me/fcm-token', { token: null });
        return true;
    } catch (error) {
        console.error("FCM token kaldırılırken hata oluştu:", error);
        return false;
    }
}
