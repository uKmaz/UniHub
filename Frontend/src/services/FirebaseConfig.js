import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDImQI0HPjaVeoIMLOdjEJUVN2szWHCeeI",
  authDomain: "unihub-n.firebaseapp.com",
  projectId: "unihub-n",
  storageBucket: "unihub-n.firebasestorage.app",
  messagingSenderId: "9151954060",
  appId: "1:9151954060:web:f69a21f2e36a50256b8fa9",
  measurementId: "G-7RH3SC5XST"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});