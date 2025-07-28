import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const UpdateProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState(''); // Değiştirilemez olacak
    const [studentId, setStudentId] = useState(''); // Değiştirilemez olacak
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCurrentData = async () => {
            try {
                const response = await api.get('/users/me');
                const profile = response.data;
                setName(profile.name);
                setSurname(profile.surname);
                setEmail(profile.email);
                setStudentId(profile.studentID.toString());
            } catch (error) {
                console.error("Kullanıcı verisi çekilemedi", error);
            } finally {
                setLoading(false);
            }
        };
        fetchCurrentData();
    }, []);

    const handleUpdate = async () => {
        setLoading(true);
        try {
            await api.put('/users/me', { name, surname });
            Alert.alert(t('successTitle'), t('updateSuccess'));
            navigation.goBack();
        } catch (error) {
            Alert.alert(t('errorTitle'), t('updateError'));
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.form}>
                <Text style={styles.label}>{t('namePlaceholder')}</Text>
                <TextInput style={styles.input} value={name} onChangeText={setName} />

                <Text style={styles.label}>{t('surnamePlaceholder')}</Text>
                <TextInput style={styles.input} value={surname} onChangeText={setSurname} />

                <Text style={styles.label}>{t('emailPlaceholder')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={email} editable={false} />
                
                <Text style={styles.label}>{t('studentIdPlaceholder')}</Text>
                <TextInput style={[styles.input, styles.disabledInput]} value={studentId} editable={false} />

                <TouchableOpacity style={styles.buttonContainer} onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    form: { padding: 20 },
    label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
    input: { height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 16, paddingHorizontal: 12, backgroundColor: '#fff', fontSize: 16 },
    disabledInput: { backgroundColor: '#e9ecef', color: '#6c757d' },
    buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default UpdateProfileScreen;