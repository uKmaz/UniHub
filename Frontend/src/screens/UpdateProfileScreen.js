import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import api from '../services/ApiService';

const UpdateProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [studentId, setStudentId] = useState('');
    const [university, setUniversity] = useState('');
    const [faculty, setFaculty] = useState('');
    const [department, setDepartment] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchCurrentData = async () => {
            try {
                const response = await api.get('/users/me');
                const profile = response.data;
                setName(profile.name);
                setSurname(profile.surname);
                setEmail(profile.email);
                setStudentId(profile.studentID.toString());
                setUniversity(profile.university);
                setFaculty(profile.faculty);
                setDepartment(profile.department);
            } catch (error) {
                console.error("Kullanıcı verisi çekilemedi", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentData();
    }, []);

    const validateForm = () => {
        const newErrors = {};
        if (name.length < 2) newErrors.name = t('validation.nameLength');
        if (surname.length < 2) newErrors.surname = t('validation.surnameLength');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;
        setIsUpdating(true);
        try {
            await api.put('/users/me', { name, surname });
            Alert.alert(t('successTitle'), t('updateSuccess'));
            navigation.goBack();
        } catch (error) {
            const errorMessage = error.response?.data?.message || t('updateError');
            Alert.alert(t('errorTitle'), errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>{t('namePlaceholder')}</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

                <Text style={styles.label}>{t('surnamePlaceholder')}</Text>
                <TextInput style={styles.input} value={surname} onChangeText={setSurname} />
                {errors.surname && <Text style={styles.errorText}>{errors.surname}</Text>}

                <Text style={styles.label}>{t('emailPlaceholder')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} />
                
                <Text style={styles.label}>{t('studentIdPlaceholder')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={studentId} editable={false} />

                <Text style={styles.label}>{t('universityLabel')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={university} editable={false} />

                <Text style={styles.label}>{t('facultyLabel')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={faculty} editable={false} />

                <Text style={styles.label}>{t('departmentLabel')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={department} editable={false} />

                <TouchableOpacity style={styles.buttonContainer} onPress={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    form: { padding: 20 },
    label: { fontSize: 16, color: theme.subtext, marginBottom: 8, marginLeft: 4 },
    input: { height: 50, borderColor: theme.border, borderWidth: 1, borderRadius: 8, marginBottom: 4, paddingHorizontal: 12, backgroundColor: theme.card, fontSize: 16, color: theme.text },
    disabledInput: { backgroundColor: theme.border, color: theme.subtext },
    buttonContainer: { backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    errorText: { color: theme.destructive, marginBottom: 12, marginLeft: 5 },
});

export default UpdateProfileScreen;