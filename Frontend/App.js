import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

// Firebase ve Dil konfigürasyonları
import { auth } from './src/services/FirebaseConfig';
import './src/i18n';

// Tüm Ekranları Import Et
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import EventsScreen from './src/screens/EventsScreen';
import SearchScreen from './src/screens/SearchScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import CreateClubScreen from './src/screens/CreateClubScreen';
import EventDetailScreen from './src/screens/EventDetailScreen';
import VerifyEmailScreen from './src/screens/VerifyEmailScreen';
import ClubDetailScreen from './src/screens/ClubDetailScreen';
import ClubManagementScreen from './src/screens/ClubManagementScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Sekmeli Ana Arayüzü Tanımlayan Component
function MainAppTabs() {
  const { t } = useTranslation();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Events') iconName = focused ? 'calendar' : 'calendar-outline';
          else if (route.name === 'Search') iconName = focused ? 'search' : 'search-outline';
          else if (route.name === 'Profile') iconName = focused ? 'person' : 'person-outline';
          else if (route.name === 'Settings') iconName = focused ? 'settings' : 'settings-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: t('homeTab') }} />
      <Tab.Screen name="Events" component={EventsScreen} options={{ title: t('eventsTab') }} />
      <Tab.Screen name="Search" component={SearchScreen} options={{ title: t('searchTab') }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: t('profileTab') }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ title: t('settingsTab') }} />
    </Tab.Navigator>
  );
}

// Ana App component'i artık tüm navigasyon mantığını içeriyor.
export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    // Bu dinleyici, giriş/çıkış anlarını ve ilk yüklemeyi yakalar.
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- YENİ VE KRİTİK useEffect ---
  // Bu, sadece kullanıcı giriş yapmış ama e-postasını doğrulamamışken çalışır.
  useEffect(() => {
    // Eğer kullanıcı varsa ve e-postası doğrulanmamışsa...
    if (user && !user.emailVerified) {
      // ...periyodik olarak durumu kontrol etmeye başla.
      const interval = setInterval(async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          await currentUser.reload();
          // reload() sonrası auth.currentUser güncellenir.
          // Eğer artık doğrulanmışsa, App'in state'ini güncelleyerek
          // yeniden render olmasını ve doğru ekrana geçmesini sağla.
          if (auth.currentUser.emailVerified) {
            setUser({ ...auth.currentUser });
          }
        }
      }, 5000); // 5 saniyede bir kontrol et

      // Bu effect'in işi bittiğinde (kullanıcı doğrulanırsa veya çıkış yaparsa),
      // interval'ı temizle.
      return () => clearInterval(interval);
    }
  }, [user]); // Bu effect, 'user' state'i her değiştiğinde yeniden çalışır.

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? ( // 1. Kullanıcı giriş yapmış mı?
          user.emailVerified ? ( // 2. E-postası doğrulanmış mı?
            // Evet, doğrulanmış -> Ana uygulama ekranlarını yükle
            <>
              <Stack.Screen name="MainApp" component={MainAppTabs} options={{ headerShown: false }} />
              <Stack.Screen name="CreateClub" component={CreateClubScreen} options={{ title: t('createClubTitle') }} />
              <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: t('eventDetails') }} />
              <Stack.Screen name="ClubDetail" component={ClubDetailScreen} options={({ route }) => ({ title: route.params?.clubName || t('clubDetails') })} />
              <Stack.Screen name="ClubManagement" component={ClubManagementScreen} options={{ title: t('managementPanelTitle') }}/>
            </>
          ) : (
            // Hayır, doğrulanmamış -> Doğrulama ekranını göster
            <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
          )
        ) : (
          // Kullanıcı giriş yapmamış -> Giriş/Kayıt ekranlarını göster
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('registerButton') }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}