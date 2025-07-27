import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// firebase-login-tester.html dosyasında kullandığın firebaseConfig objesinin aynısı.
// Firebase Console -> Project settings -> General sekmesinden alabilirsin.
const firebaseConfig = {
    apiKey: "AIzaSyAYpNhpP2L5LPbdFXy9n3g7VAQ1sa_AE2M",
    authDomain: "unihub-aea98.firebaseapp.com",
    projectId: "unihub-aea98",
    storageBucket: "unihub-aea98.firebasestorage.app",
    messagingSenderId: "612135067573",
    appId: "1:612135067573:web:38100edf36e672542303fc"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});