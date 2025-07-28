import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { signOut } from 'firebase/auth';
import { auth } from '../services/FirebaseConfig';
import api from '../services/ApiService'; // -> YENİ

const SettingsScreen = () => {
    const { t, i18n } = useTranslation();
    const isTurkish = i18n.language === 'tr';

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

    // YENİ FONKSİYON: Hesabı sil
    const handleDeleteAccount = () => {
        Alert.alert(
            t('deleteAccountConfirmTitle'),
            t('deleteAccountConfirmMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('deleteAccount'), style: 'destructive', onPress: async () => {
                    try {
                        await api.delete('/users/me');
                        // Başarılı silme sonrası App.js'teki onAuthStateChanged
                        // kullanıcıyı otomatik olarak Login'e atacak.
                        Alert.alert(t('successTitle'), t('accountDeleteSuccess'));
                    } catch (error) {
                        console.error("Hesap silinemedi:", error);
                        Alert.alert(t('errorTitle'), t('accountDeleteError'));
                    }
                }}
            ]
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('settingsTitle')}</Text>
            <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>{t('language')}</Text>
                <View style={styles.languageToggle}>
                    <TouchableOpacity style={[styles.toggleButton, isTurkish ? styles.activeButton : styles.inactiveButton]} onPress={() => changeLanguage('tr')}>
                        <Text style={isTurkish ? styles.activeText : styles.inactiveText}>TR</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.toggleButton, !isTurkish ? styles.activeButton : styles.inactiveButton]} onPress={() => changeLanguage('en')}>
                        <Text style={!isTurkish ? styles.activeText : styles.inactiveText}>EN</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <TouchableOpacity style={[styles.buttonBase, styles.logoutButton]} onPress={handleLogout}>
                <Text style={styles.buttonText}>{t('logout')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.buttonBase, styles.deleteButton]} onPress={handleDeleteAccount}>
                <Text style={styles.buttonText}>{t('deleteAccount')}</Text>
            </TouchableOpacity>


        </SafeAreaView>
    );
};

// Stillerde değişiklik yok...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#ddd' },
    settingLabel: { fontSize: 18 },
    languageToggle: { flexDirection: 'row', borderWidth: 1, borderColor: '#007AFF', borderRadius: 8 },
    toggleButton: { paddingHorizontal: 15, paddingVertical: 8 },
    activeButton: { backgroundColor: '#007AFF' },
    inactiveButton: { backgroundColor: 'transparent' },
    activeText: { color: '#fff', fontWeight: 'bold' },
    inactiveText: { color: '#007AFF' },
    logoutButton: { backgroundColor: '#FF3B30', borderRadius: 8, paddingVertical: 15, alignItems: 'center', margin: 20, marginTop: 30 },
    logoutButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    buttonBase: { borderRadius: 8, paddingVertical: 15, alignItems: 'center', marginHorizontal: 20 },
    logoutButton: { backgroundColor: '#FF3B30', marginTop: 10 },
    deleteButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF3B30', marginTop: 30 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default SettingsScreen;