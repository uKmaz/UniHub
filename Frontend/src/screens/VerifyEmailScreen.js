import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator } from 'react-native';
import { auth } from '../services/FirebaseConfig';
import { sendEmailVerification, signOut } from 'firebase/auth';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const VerifyEmailScreen = () => {
    const { t } = useTranslation();
    const [isSending, setIsSending] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

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

    const handleStartOver = () => {
        Alert.alert(
            t('startOverConfirmTitle'),
            t('startOverConfirmMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                { 
                    text: t('startOver'), 
                    style: 'destructive', 
                    onPress: async () => {
                        setIsDeleting(true);
                        try {
                            // Backend'deki silme endpoint'ini çağırmayı dene.
                            await api.delete('/users/me/unverified');
                        } catch (error) {
                            console.error("Backend'den kullanıcı silinirken hata:", error);
                            // Backend başarısız olursa kullanıcıya bir hata göster.
                            Alert.alert(t('errorTitle'), "Hesap silinirken bir sorun oluştu.");
                        } finally {
                            // İşlem başarılı da olsa başarısız da olsa, HER ZAMAN frontend'den çıkış yap.
                            // Bu, kullanıcının bu ekranda takılı kalmasını engeller.
                            await signOut(auth);
                            setIsDeleting(false);
                        }
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.title}>{t('verifyEmailTitle')}</Text>
            <Text style={styles.subtitle}>{t('verifyEmailSubtitle', { email: auth.currentUser?.email })}</Text>
            
            <TouchableOpacity style={styles.button} onPress={resendVerificationEmail} disabled={isSending || isDeleting}>
                {isSending ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('resendEmailButton')}</Text>}
            </TouchableOpacity>

            <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]} 
                onPress={handleStartOver}
                disabled={isSending || isDeleting}
            >
                {isDeleting ? <ActivityIndicator color="#007AFF" /> : <Text style={[styles.buttonText, styles.secondaryButtonText]}>{t('startOver')}</Text>}
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