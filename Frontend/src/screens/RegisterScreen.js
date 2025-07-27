import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/FirebaseConfig';
import api from '../services/ApiService';

const RegisterScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [studentId, setStudentId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};
        if (name.length < 2) newErrors.name = "İsim en az 2 karakter olmalıdır.";
        if (surname.length < 2) newErrors.surname = "Soyisim en az 2 karakter olmalıdır.";
        if (!/^\d{10}$/.test(studentId)) newErrors.studentId = "Öğrenci numarası 10 rakamdan oluşmalıdır.";
        if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Geçerli bir e-posta adresi girin.";
        if (password.length < 6 || password.length > 40) newErrors.password = "Şifre 6 ile 40 karakter arasında olmalıdır.";
        if (password !== confirmPassword) newErrors.confirmPassword = t('passwordsDoNotMatch');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleRegister = async () => {
        if (!validateForm()) return;

        setLoading(true);
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, { displayName: name });

            // Doğrulama e-postası gönder
            await sendEmailVerification(user);

            // Backend'e senkronizasyon isteği at
            await api.post('/auth/register', {
                studentID: Number(studentId),
                surname: surname,
            });

        } catch (error) {
            console.error("Kayıt sırasında hata:", error);
            
            let errorMessage = t('registrationError');
            
            if (error.response) {
                errorMessage = error.response.data.message || errorMessage;
            } else if (error.code) {
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage = 'Bu e-posta adresi Firebase üzerinde zaten kayıtlı.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage = 'Şifre en az 6 karakter olmalıdır.';
                }
            }
            
            Alert.alert(t('registrationFailed'), errorMessage);
            
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>{t('registerTitle')}</Text>
                
                <TextInput 
                    style={styles.input} 
                    placeholder={t('namePlaceholder')} 
                    value={name} 
                    onChangeText={setName}
                    textContentType="name" // -> EKLENDİ
                    autoComplete="name"      // -> EKLENDİ
                />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                
                <TextInput 
                    style={styles.input} 
                    placeholder={t('surnamePlaceholder')} 
                    value={surname} 
                    onChangeText={setSurname}
                    textContentType="familyName" // -> EKLENDİ
                    autoComplete="name-family"   // -> EKLENDİ
                />
                {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder={t('studentIdPlaceholder')} 
                    value={studentId} 
                    onChangeText={setStudentId} 
                    keyboardType="number-pad" 
                    maxLength={10} 
                />
                {errors.studentId && <Text style={styles.errorText}>{errors.studentId}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder={t('emailPlaceholder')} 
                    value={email} 
                    onChangeText={setEmail} 
                    keyboardType="email-address" 
                    autoCapitalize="none"
                    textContentType="emailAddress" // -> EKLENDİ
                    autoComplete="email"          // -> EKLENDİ
                />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder={t('passwordPlaceholder')} 
                    value={password} 
                    onChangeText={setPassword} 
                    secureTextEntry 
                    textContentType="newPassword" // -> EKLENDİ
                    autoComplete="password-new"   // -> EKLENDİ
                />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TextInput 
                    style={styles.input} 
                    placeholder={t('confirmPasswordPlaceholder')} 
                    value={confirmPassword} 
                    onChangeText={setConfirmPassword} 
                    secureTextEntry 
                    textContentType="newPassword" // -> EKLENDİ
                    autoComplete="password-new"   // -> EKLENDİ
                />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                <TouchableOpacity 
                    style={styles.buttonContainer} 
                    onPress={handleRegister}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('registerButton')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContainer: { padding: 20, justifyContent: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
    input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 4, paddingHorizontal: 12, backgroundColor: '#fff', fontSize: 16 },
    buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: 'red', marginBottom: 12, marginLeft: 5 },
});

export default RegisterScreen;
