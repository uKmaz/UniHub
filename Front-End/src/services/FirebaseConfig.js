import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// firebase-login-tester.html dosyasında kullandığın firebaseConfig objesinin aynısı.
// Firebase Console -> Project settings -> General sekmesinden alabilirsin.
const firebaseConfig = {
    apiKey: "AIzaSyAYpNhpP2L5LPbdFXy9n3g7VAQ1sa_AE2M",
    authDomain: "unihub-aea98.firebaseapp.com",
    projectId: "unihub-aea98",
    storageBucket: "unihub-aea98.appspot.com",
    messagingSenderId: "612135067573",
    appId: "1:612135067573:web:38100edf36e672542303fc"
};

// Firebase'i başlat
const app = initializeApp(firebaseConfig);

// Authentication servisini alıp export et
export const auth = getAuth(app);