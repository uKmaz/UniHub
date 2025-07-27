import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { auth } from '../services/FirebaseConfig';
import { sendEmailVerification } from 'firebase/auth';
import { useTranslation } from 'react-i18next';

const VerifyEmailScreen = () => {
    const { t } = useTranslation();
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        // Bu interval, App.js'teki onAuthStateChanged'i tetiklemek için
        // periyodik olarak kullanıcının durumunu yeniler.
        const interval = setInterval(() => {
            auth.currentUser?.reload();
        }, 5000); // 5 saniyede bir kontrol et

        return () => clearInterval(interval);
    }, []);

    const resendVerificationEmail = async () => {
        if (!auth.currentUser) return;
        setIsSending(true);
        try {
            await sendEmailVerification(auth.currentUser);
            Alert.alert(t('successTitle'), t('resendEmailSuccess'));
        } catch (error) {
            Alert.alert(t('errorTitle'), t('resendEmailError'));
            console.error(error);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('verifyEmailTitle')}</Text>
            <Text style={styles.subtitle}>{t('verifyEmailSubtitle', { email: auth.currentUser?.email })}</Text>
            <TouchableOpacity style={styles.button} onPress={resendVerificationEmail} disabled={isSending}>
                <Text style={styles.buttonText}>{t('resendEmailButton')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
    subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24, color: '#666' },
    button: { backgroundColor: '#007AFF', paddingVertical: 15, paddingHorizontal: 30, borderRadius: 8 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default VerifyEmailScreen;