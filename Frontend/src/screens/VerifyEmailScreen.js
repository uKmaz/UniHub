import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../services/FirebaseConfig';
import { sendEmailVerification, deleteUser } from 'firebase/auth'; // -> deleteUser import et
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';

const VerifyEmailScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [isSending, setIsSending] = useState(false);

    // ... (resendVerificationEmail fonksiyonu aynı)

    // YENİ FONKSİYON: Kaydı iptal et ve Firebase kullanıcısını sil
    const handleStartOver = () => {
        Alert.alert(
            t('startOverConfirmTitle'),
            t('startOverConfirmMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('startOver'), style: 'destructive', onPress: async () => {
                    const user = auth.currentUser;
                    if (user) {
                        try {
                            await deleteUser(user);
                        } catch (error) {
                            console.error("Firebase kullanıcısı silinemedi:", error);
                            Alert.alert(t('errorTitle'), "Hesap silinirken bir hata oluştu.");
                        }
                    }
                }}
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('verifyEmailTitle')}</Text>
            <Text style={styles.subtitle}>{t('verifyEmailSubtitle', { email: auth.currentUser?.email })}</Text>
            
            <TouchableOpacity style={styles.button} onPress={resendVerificationEmail} disabled={isSending}>
                {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('resendEmailButton')}</Text>}
            </TouchableOpacity>

            {/* YENİ BUTON: Baştan Başla */}
            <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleStartOver}>
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('startOver')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24, color: '#666' },
    button: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, minWidth: 220, alignItems: 'center', marginBottom: 12 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
    secondaryButton: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#007AFF' },
    secondaryButtonText: { color: '#007AFF' }
});

export default VerifyEmailScreen;