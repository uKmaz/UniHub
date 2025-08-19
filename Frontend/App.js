import React, { useState, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

// Firebase, Dil ve Tema konfigürasyonları
import { auth } from './src/services/FirebaseConfig';
import './src/i18n';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';

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
import EditClubScreen from './src/screens/EditClubScreen';
import UpdateProfileScreen from './src/screens/UpdateProfileScreen';
import ClubLogScreen from './src/screens/ClubLogScreen';
import MemberDetailScreen from './src/screens/MemberDetailScreen';
import CreatePostScreen from './src/screens/CreatePostScreen';
import CreateEventScreen from './src/screens/CreateEventScreen';
import PostDetailScreen from './src/screens/PostDetailScreen';
import EventFormScreen from './src/screens/EventFormScreen';
import EventSubmissionsScreen from './src/screens/EventSubmissionsScreen';
import FilterScreen from './src/screens/FilterScreen';
import EditPostScreen from './src/screens/EditPostScreen';
import EditEventScreen from './src/screens/EditEventScreen';


const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainAppTabs() {
  const { t } = useTranslation();
  const { theme } = useTheme();
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
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: { backgroundColor: theme.card, borderTopColor: theme.border },
        headerStyle: { backgroundColor: theme.card },
        headerTitleStyle: { color: theme.text },
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

// Navigasyon mantığını içeren ayrı bir component
function AppNavigator() {
    const { isDarkMode, theme } = useTheme();
    const { t } = useTranslation();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    const navigationTheme = isDarkMode ? DarkTheme : DefaultTheme;

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authenticatedUser) => {
            if (authenticatedUser) {
                await authenticatedUser.reload();
                setUser({ ...auth.currentUser });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (user && !user.emailVerified) {
            const interval = setInterval(async () => {
                const currentUser = auth.currentUser;
                if (currentUser) {
                    await currentUser.reload();
                    if (auth.currentUser.emailVerified) {
                        setUser({ ...auth.currentUser });
                    }
                }
            }, 3000);
            return () => clearInterval(interval);
        }
    }, [user]);

    if (loading) {
        return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}><ActivityIndicator size="large" /></View>;
    }

    return (
        <NavigationContainer theme={{
            ...navigationTheme,
            colors: {
                ...navigationTheme.colors,
                background: theme.background,
                card: theme.card,
                text: theme.text,
                border: theme.border,
                primary: theme.primary,
            },
        }}>
            <Stack.Navigator screenOptions={{
                headerStyle: { backgroundColor: theme.card },
                headerTitleStyle: { color: theme.text },
                headerTintColor: theme.primary,
            }}>
                {user ? (
                    user.emailVerified ? (
                        <>
                            <Stack.Screen name="MainApp" component={MainAppTabs} options={{ headerShown: false }} />
                            <Stack.Screen name="CreateClub" component={CreateClubScreen} options={{ title: t('createClubTitle') }} />
                            <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: t('eventDetails') }} />
                            <Stack.Screen name="ClubDetail" component={ClubDetailScreen} options={({ route }) => ({ title: route.params?.clubName || t('clubDetails') })} />
                            <Stack.Screen name="ClubManagement" component={ClubManagementScreen} options={{ title: t('managementPanelTitle') }}/>
                            <Stack.Screen name="EditClub" component={EditClubScreen} options={{ title: t('editClubTitle') }} />
                            <Stack.Screen name="UpdateProfile" component={UpdateProfileScreen} options={{ title: t('updateProfileTitle') }} />
                            <Stack.Screen name="ClubLogs" component={ClubLogScreen} options={{ title: t('clubLogsTitle') }} />
                            <Stack.Screen name="MemberDetail" component={MemberDetailScreen} options={({ route }) => ({ title: route.params?.memberName || t('memberDetailTitle') })} />
                            <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: t('createPostTitle') }} />
                            <Stack.Screen name="CreateEvent" component={CreateEventScreen} options={{ title: t('createEventTitle') }} />
                            <Stack.Screen name="PostDetail" component={PostDetailScreen} options={{ title: t('postDetailsTitle') }} />
                            <Stack.Screen name="EventForm" component={EventFormScreen} options={{ title: 'Katılım Formu' }} />
                            <Stack.Screen name="EventSubmissions" component={EventSubmissionsScreen} options={{ title: t('submissionsTitle') }} />
                            <Stack.Screen name="Filter" component={FilterScreen} options={{ presentation: 'modal', title: t('filters') }} />
                            <Stack.Screen name="EditPost" component={EditPostScreen} options={{ title: t('editPostTitle') }} />
                            <Stack.Screen name="EditEvent" component={EditEventScreen} options={{ title: t('editEventTitle') }} />
                        </>
                    ) : (
                        <Stack.Screen name="VerifyEmail" component={VerifyEmailScreen} options={{ headerShown: false }} />
                    )
                ) : (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
                        <Stack.Screen name="Register" component={RegisterScreen} options={{ title: t('registerButton') }} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

// Ana App component'i artık sadece Provider'ları ve Navigatör'ü render ediyor
export default function App() {
    return (
        <ThemeProvider>
            <AppNavigator />
        </ThemeProvider>
    );
}
