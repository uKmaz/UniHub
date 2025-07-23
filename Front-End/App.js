import React from 'react';

// Navigation kütüphanelerini import et
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Dil yapılandırmasını projenin en başında bir kez import et
import './src/i18n';

// Uygulamanın tüm ekranlarını import et
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';

// Bir Stack Navigator örneği oluştur
const Stack = createStackNavigator();

/**
 * Bu, uygulamanın ana bileşenidir.
 * Tüm ekranlar arasındaki geçiş mantığını yönetir.
 */
export default function App() {
  return (
    // NavigationContainer, tüm navigasyon yapısını sarmalar
    <NavigationContainer>
      {/* Stack.Navigator, ekranları bir yığın gibi yönetir */}
      <Stack.Navigator 
        // Uygulama ilk açıldığında gösterilecek ekran
        initialRouteName="Login"
        // Tüm ekranlar için varsayılan stil ayarları
        screenOptions={{
          headerStyle: {
            backgroundColor: '#f4511e', // Örnek bir başlık rengi
          },
          headerTintColor: '#fff', // Başlık yazı rengi
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {/* Giriş Ekranı Tanımı */}
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          // Bu ekranda başlığın görünmemesini sağlıyoruz
          options={{ headerShown: false }} 
        />
        
        {/* Kayıt Ekranı Tanımı */}
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          // Bu ekranın başlığında "Kayıt Ol" yazacak
          options={{ title: 'Kayıt Ol' }} 
        />
        
        {/* Ana Ekran Tanımı */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen}
          // Bu ekranın başlığında "Ana Sayfa" yazacak
          options={{ title: 'Ana Sayfa' }}
        />
        
        {/* Gelecekte eklenecek diğer ekranlar buraya gelecek... */}
        {/* Örnek: <Stack.Screen name="Profile" component={ProfileScreen} /> */}
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}
