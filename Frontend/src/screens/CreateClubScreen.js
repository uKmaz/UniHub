import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    Alert, 
    TouchableOpacity, 
    SafeAreaView, 
    ActivityIndicator, 
    ScrollView 
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import api from '../services/ApiService';

// Veri yapısını daha temiz hale getirelim
const universityData = [
    {
        name: 'Dokuz Eylül Üniversitesi',
        faculties: [
            { name: 'Mühendislik Fakültesi', departments: ['Bilgisayar Mühendisliği', 'Makine Mühendisliği', 'İnşaat Mühendisliği', 'Elektrik-Elektronik Mühendisliği'] },
            { name: 'İktisadi ve İdari Bilimler Fakültesi', departments: ['İşletme', 'İktisat', 'Uluslararası İlişkiler', 'Ekonometri'] },
            { name: 'Tıp Fakültesi', departments: ['Tıp'] },
            { name: 'Fen Fakültesi', departments: ['Matematik', 'Fizik', 'Kimya', 'Biyoloji'] },
        ]
    },
];

const CreateClubScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    // Seçimleri tek bir state objesinde tutmak daha yönetilebilir
    const [selection, setSelection] = useState({
        university: universityData[0].name,
        faculty: universityData[0].faculties[0].name,
        department: universityData[0].faculties[0].departments[0],
    });

    // Seçimlere bağlı olarak değişen listeler için state'ler
    const [availableFaculties, setAvailableFaculties] = useState(universityData[0].faculties);
    const [availableDepartments, setAvailableDepartments] = useState(universityData[0].faculties[0].departments);

    // Üniversite seçimi değiştiğinde
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

    // Fakülte seçimi değiştiğinde
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

    const handleCreateClub = async () => {
        if (!name || !description) {
            Alert.alert(t('errorTitle'), t('fillAllFields'));
            return;
        }

        // HATA AYIKLAMA: Gönderilecek veriyi konsola yazdır
        console.log("Gönderilen Veri:", {
            name,
            description,
            university: selection.university,
            faculty: selection.faculty,
            department: selection.department,
        });

        setLoading(true);
        try {
            const response = await api.post('/clubs', {
                name,
                description,
                university: selection.university,
                faculty: selection.faculty,
                department: selection.department,
            });
            
            Alert.alert(t('successTitle'), t('clubCreateSuccess', { clubName: response.data.name }));
            navigation.goBack();

        } catch (error) {
            console.error("Kulüp oluşturulurken hata:", error.response?.data || error.message);
            Alert.alert(t('errorTitle'), t('clubCreateError'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContainer}>
                <Text style={styles.title}>{t('createClubTitle')}</Text>
                
                <TextInput style={styles.input} placeholder={t('clubNamePlaceholder')} value={name} onChangeText={setName} />
                <TextInput style={styles.input} placeholder={t('clubDescriptionPlaceholder')} value={description} onChangeText={setDescription} multiline />
                
                <Text style={styles.label}>{t('universityLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.university}
                        onValueChange={(itemValue) => handleUniversityChange(itemValue)}
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
                    >
                        {availableDepartments.map((department) => (
                            <Picker.Item key={department} label={department} value={department} />
                        ))}
                    </Picker>
                </View>

                <TouchableOpacity 
                    style={styles.buttonContainer} 
                    onPress={handleCreateClub}
                    disabled={loading}
                >
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('createClubButton')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollContainer: { padding: 20 },
    title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
    input: { borderColor: '#ddd', borderWidth: 1, borderRadius: 8, marginBottom: 16, paddingHorizontal: 15, paddingVertical: 12, backgroundColor: '#fff', fontSize: 16, textAlignVertical: 'top' },
    label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
    pickerContainer: {
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 8,
        marginBottom: 16,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    buttonContainer: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CreateClubScreen;
