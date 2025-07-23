import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Firebase'in giriş fonksiyonu
import { auth } from '../services/FirebaseConfig';


const LoginScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation(); 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // Yükleme durumu için state

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert("Hata", "Lütfen e-posta ve şifre alanlarını doldurun.");
            return;
        }

        setLoading(true); // İşlem başlarken yükleniyor durumunu aktif et
        try {
            // Firebase ile giriş yapmayı dene
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            
            console.log('Giriş başarılı:', user.email);

            // Başarılı giriş sonrası token'ı al (şimdilik sadece konsola yazdırıyoruz)
            const idToken = await user.getIdToken();
            console.log('Firebase ID Token:', idToken);

            // Kullanıcıyı Ana Ekrana yönlendir
            navigation.replace('Home'); 

        } catch (error) {
            // Hata durumunda kullanıcıya bilgi ver
            console.error(error);
            Alert.alert("Giriş Başarısız", "E-posta veya şifre hatalı.");
        } finally {
            setLoading(false); // İşlem bitince yükleniyor durumunu kapat
        }
    };

    // ... (dil değiştirme ve diğer fonksiyonlar aynı)
    const toggleLanguage = () => {
        const newLang = i18n.language === 'tr' ? 'en' : 'tr';
        i18n.changeLanguage(newLang);
    };

    return (
        <SafeAreaView style={styles.container}>
            <TouchableOpacity style={styles.languageButton} onPress={toggleLanguage}>
                <Text style={styles.languageButtonText}>TR / EN</Text>
            </TouchableOpacity>

            <View style={styles.formContainer}>
                <Text style={styles.title}>{t('welcomeMessage')}</Text>
                
                <TextInput
                    style={styles.input}
                    placeholder={t('emailPlaceholder')}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                
                <TextInput
                    style={styles.input}
                    placeholder={t('passwordPlaceholder')}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />

                <TouchableOpacity 
                    style={styles.buttonContainer} 
                    onPress={handleLogin}
                    disabled={loading} // Yüklenirken butonu pasif yap
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" /> // Yüklenirken dönen ikon
                    ) : (
                        <Text style={styles.buttonText}>{t('loginButton')}</Text>
                    )}
                </TouchableOpacity>

                <View style={styles.registerContainer}>
                    <Text style={styles.registerText}>{t('registerPrompt')}</Text>
                    <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                        <Text style={styles.registerLink}>{t('registerButton')}</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

// Stiller aynı kalabilir...
const styles = StyleSheet.create({
    // ...
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 24,
        color: '#333',
    },
    input: {
        height: 50,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        fontSize: 16,
    },
    buttonContainer: {
        backgroundColor: '#007AFF',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
    registerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 20,
    },
    registerText: {
        fontSize: 16,
    },
    registerLink: {
        fontSize: 16,
        color: '#007AFF',
        fontWeight: 'bold',
        marginLeft: 5,
    },
    languageButton: {
        position: 'absolute',
        top: 50, 
        right: 20,
        padding: 10,
        borderRadius: 8,
        backgroundColor: '#e0e0e0'
    },
    languageButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333'
    }
});

export default LoginScreen;