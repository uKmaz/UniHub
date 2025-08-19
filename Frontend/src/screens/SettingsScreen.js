import React, { useState, useEffect } from 'react'; // -> useState ve useEffect eklendi
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import { signOut, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from '../services/FirebaseConfig';
import api from '../services/ApiService';
import { useTheme } from '../context/ThemeContext';
import * as Notifications from 'expo-notifications';
import { registerForPushNotificationsAsync, unregisterFromPushNotificationsAsync } from '../services/NotificationService';

const SettingsScreen = () => {
    const { t, i18n } = useTranslation();
    const { isDarkMode, theme, toggleTheme } = useTheme();
    const [notificationsEnabled, setNotificationsEnabled] = useState(false);
    const isTurkish = i18n.language === 'tr';

    useEffect(() => {
        const checkNotificationStatus = async () => {
            const { status } = await Notifications.getPermissionsAsync();
            setNotificationsEnabled(status === 'granted');
        };
        checkNotificationStatus();
    }, []);

    const handleNotificationToggle = async (newValue) => {
        if (newValue) {
            const success = await registerForPushNotificationsAsync();
            setNotificationsEnabled(success);
        } else {
            const success = await unregisterFromPushNotificationsAsync();
            if (success) {
                setNotificationsEnabled(false);
            }
        }
    };

    const changeLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };

    const handleLogout = async () => {
        try {
            await signOut(auth);
        } catch (error) {
            console.error("Çıkış yaparken hata:", error);
            Alert.alert(t('errorTitle'), t('logoutError'));
        }
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            t('deleteAccountConfirmTitle'),
            t('deleteAccountConfirmMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('deleteAccount'), style: 'destructive', onPress: () => promptForPasswordAndDelete() }
            ]
        );
    };

    const promptForPasswordAndDelete = () => {
        Alert.prompt(
            t('reAuthTitle'),
            t('reAuthMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('confirm'),
                    onPress: async (password) => {
                        if (password) {
                            await reauthenticateAndThenDelete(password);
                        }
                    },
                },
            ],
            'secure-text'
        );
    };

    const reauthenticateAndThenDelete = async (password) => {
        const user = auth.currentUser;
        if (!user) return;
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await api.delete('/users/me');
            Alert.alert(t('successTitle'), t('accountDeleteSuccess'));
        } catch (error) {
            console.error("Hesap silme sırasında hata:", error);
            if (error.code === 'auth/wrong-password') {
                Alert.alert(t('errorTitle'), t('wrongPassword'));
            } else {
                Alert.alert(t('errorTitle'), t('accountDeleteError'));
            }
        }
    };

    const styles = getStyles(theme);

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('settingsTitle')}</Text>
            
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <View style={styles.languageToggle}>
                    <TouchableOpacity 
                        style={[styles.toggleButton, isTurkish ? styles.activeButton : styles.inactiveButton]}
                        onPress={() => changeLanguage('tr')}
                    >
                        <Text style={isTurkish ? styles.activeText : styles.inactiveText}>TR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.toggleButton, !isTurkish ? styles.activeButton : styles.inactiveButton]}
                        onPress={() => changeLanguage('en')}
                    >
                        <Text style={!isTurkish ? styles.activeText : styles.inactiveText}>EN</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('darkMode')}</Text>
                <Switch
                    value={isDarkMode}
                    onValueChange={toggleTheme}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor={"#f4f3f4"}
                />
            </View>

            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('allowNotifications')}</Text>
                <Switch
                    value={notificationsEnabled}
                    onValueChange={handleNotificationToggle}
                    trackColor={{ false: "#767577", true: theme.primary }}
                    thumbColor={"#f4f3f4"}
                />
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.buttonBase, styles.deleteButton]} onPress={handleDeleteAccount}>
                    <Text style={[styles.buttonText, styles.deleteButtonText]}>{t('deleteAccount')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.buttonBase, styles.logoutButton]} onPress={handleLogout}>
                    <Text style={styles.buttonText}>{t('logout')}</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20, color: theme.text },
    settingRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        backgroundColor: theme.card, 
        paddingHorizontal: 20, 
        paddingVertical: 15, 
        borderBottomWidth: 1, 
        borderBottomColor: theme.border 
    },
    settingLabel: { fontSize: 18, color: theme.text },
    languageToggle: { flexDirection: 'row', borderWidth: 1, borderColor: theme.primary, borderRadius: 8, overflow: 'hidden' },
    toggleButton: { paddingHorizontal: 15, paddingVertical: 8 },
    activeButton: { backgroundColor: theme.primary },
    inactiveButton: { backgroundColor: 'transparent' },
    activeText: { color: '#fff', fontWeight: 'bold' },
    inactiveText: { color: theme.primary },
    actionsContainer: {
        marginTop: 30,
        paddingHorizontal: 20,
    },
    buttonBase: { 
        borderRadius: 8, 
        paddingVertical: 15, 
        alignItems: 'center', 
        justifyContent: 'center'
    },
    logoutButton: { 
        backgroundColor: theme.destructive, 
        marginTop: 12 
    },
    deleteButton: { 
        backgroundColor: 'transparent', 
        borderWidth: 1, 
        borderColor: theme.destructive 
    },
    buttonText: { 
        color: '#fff', 
        fontSize: 18, 
        fontWeight: 'bold' 
    },
    deleteButtonText: {
        color: theme.destructive
    }
});

export default SettingsScreen;