import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from 'firebase/auth';
import { auth } from '../services/FirebaseConfig';
import api from '../services/ApiService';
import { universityData } from '../data/universityData';
import { useTheme } from '../context/ThemeContext';

const RegisterScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    // Form state'leri
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [studentId, setStudentId] = useState('');
    const [email, setEmail] = useState('');
    const [confirmEmail, setConfirmEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Picker state'leri
    const [selection, setSelection] = useState({
        university: universityData[0].name,
        faculty: universityData[0].faculties[0].name,
        department: universityData[0].faculties[0].departments[0],
    });
    const [availableFaculties, setAvailableFaculties] = useState(universityData[0].faculties);
    const [availableDepartments, setAvailableDepartments] = useState(universityData[0].faculties[0].departments);

    const validateForm = () => {
        const newErrors = {};
        if (name.length < 2) newErrors.name = t('nameLength');
        if (surname.length < 2) newErrors.surname = t('surnameLength');
        if (!/^\d{6,15}$/.test(studentId)) newErrors.studentId = t('studentIdLength');
        if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = t('emailFormat');
        if (email !== confirmEmail) newErrors.confirmEmail = t('emailsDoNotMatch');
        if (password.length < 6 || password.length > 40) newErrors.password = t('passwordLength');
        if (password !== confirmPassword) newErrors.confirmPassword = t('passwordsDoNotMatch');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUniversityChange = (uniName) => {
        const university = universityData.find(u => u.name === uniName);
        if (university) {
            const firstFaculty = university.faculties[0];
            const firstDepartment = firstFaculty.departments[0];
            
            setAvailableFaculties(university.faculties);
            setAvailableDepartments(firstFaculty.departments);
            
            setSelection({
                university: uniName,
                faculty: firstFaculty.name,
                department: firstDepartment,
            });
        }
    };

    const handleFacultyChange = (facultyName) => {
        const faculty = availableFaculties.find(f => f.name === facultyName);
        if (faculty) {
            const firstDepartment = faculty.departments[0];
            
            setAvailableDepartments(faculty.departments);
            
            setSelection(prev => ({
                ...prev,
                faculty: facultyName,
                department: firstDepartment,
            }));
        }
    };

   const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        await sendEmailVerification(user);

        // 🔹 Token'ı zorla yenile
        const token = await user.getIdToken(true);

        // 🔹 Backend'e token ile isteği gönder
        await api.post('/auth/register', {
            studentID: Number(studentId),
            surname: surname,
            university: selection.university,
            faculty: selection.faculty,
            department: selection.department,
        }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        // App.js'teki onAuthStateChanged yönlendirmeyi otomatik yapacak
    } catch (error) {
        const errorMessage = error.response?.data?.message || error.message || t('registrationError');
        Alert.alert(t('registrationFailed'), errorMessage);
    } finally {
        setLoading(false);
    }
};


    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>{t('registerTitle')}</Text>
                
                <TextInput style={styles.input} placeholder={t('namePlaceholder')} value={name} onChangeText={setName} placeholderTextColor={theme.subtext} />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <TextInput style={styles.input} placeholder={t('surnamePlaceholder')} value={surname} onChangeText={setSurname} placeholderTextColor={theme.subtext} />
                {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}

                <TextInput style={styles.input} placeholder={t('studentIdPlaceholder')} value={studentId} onChangeText={setStudentId} keyboardType="number-pad" maxLength={15} placeholderTextColor={theme.subtext} />
                {errors.studentId && <Text style={styles.errorText}>{errors.studentId}</Text>}

                <TextInput style={styles.input} placeholder={t('emailPlaceholder')} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.subtext} />
                {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                <TextInput style={styles.input} placeholder={t('confirmEmailPlaceholder')} value={confirmEmail} onChangeText={setConfirmEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={theme.subtext} />
                {errors.confirmEmail && <Text style={styles.errorText}>{errors.confirmEmail}</Text>}

                <TextInput style={styles.input} placeholder={t('passwordPlaceholder')} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={theme.subtext} />
                {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

                <TextInput style={styles.input} placeholder={t('confirmPasswordPlaceholder')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholderTextColor={theme.subtext} />
                {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                <Text style={styles.label}>{t('universityLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.university}
                        onValueChange={(itemValue) => handleUniversityChange(itemValue)}
                        dropdownIconColor={theme.text}
                        style={{ color: theme.text }}
                    >
                        {universityData.map((uni) => (
                            <Picker.Item key={uni.name} label={uni.name} value={uni.name} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>{t('facultyLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.faculty}
                        onValueChange={(itemValue) => handleFacultyChange(itemValue)}
                        dropdownIconColor={theme.text}
                        style={{ color: theme.text }}
                    >
                        {availableFaculties.map((faculty) => (
                            <Picker.Item key={faculty.name} label={faculty.name} value={faculty.name} />
                        ))}
                    </Picker>
                </View>

                <Text style={styles.label}>{t('departmentLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.department}
                        onValueChange={(itemValue) => setSelection(prev => ({ ...prev, department: itemValue }))}
                        dropdownIconColor={theme.text}
                        style={{ color: theme.text }}
                    >
                        {availableDepartments.map((department) => (
                            <Picker.Item key={department} label={department} value={department} />
                        ))}
                    </Picker>
                </View>

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

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContainer: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24, color: theme.text },
    input: { borderColor: theme.border, borderWidth: 1, borderRadius: 8, marginBottom: 4, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: theme.card, fontSize: 16, color: theme.text },
    label: { fontSize: 16, color: theme.subtext, marginBottom: 8, marginLeft: 4 },
    pickerContainer: {
        borderColor: theme.border,
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: theme.card,
        justifyContent: 'center',
    },
    buttonContainer: { backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: theme.destructive, alignSelf: 'flex-start', marginLeft: 5, marginBottom: 12 },
});

export default RegisterScreen;
