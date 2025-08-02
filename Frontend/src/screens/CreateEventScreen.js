import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, FlatList, Platform, Image, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '../services/ApiService';

const CreateEventScreen = ({ route, navigation }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    
    // Form state'leri
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [date, setDate] = useState(new Date());
    const [questions, setQuestions] = useState([]);
    
    // Arayüz state'leri
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');
    
    const questionTypes = ['TEXT', 'BOOLEAN', 'PHONE', 'EMAIL'];

    const onDateChange = (event, selectedDate) => {
        setShowPicker(Platform.OS === 'ios');
        if (selectedDate) setDate(selectedDate);
    };

    const showMode = (currentMode) => {
        setShowPicker(true);
        setPickerMode(currentMode);
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            aspect: [16, 9],
            quality: 0.7,
        });
        if (!result.canceled && result.assets) {
            setImageUri(result.assets[0].uri);
        }
    };

    const addQuestion = useCallback(() => {
        setQuestions(prev => [...prev, { id: Date.now(), text: '', type: 'TEXT' }]);
    }, []);

    const updateQuestion = useCallback((id, newValues) => {
        setQuestions(currentQuestions =>
            currentQuestions.map(q => (q.id === id ? { ...q, ...newValues } : q))
        );
    }, []);

    const removeQuestion = useCallback((id) => {
        setQuestions(currentQuestions => currentQuestions.filter(q => q.id !== id));
    }, []);

    const handleCreateEvent = async () => {
        if (!description || !location) {
            Alert.alert(t('errorTitle'), t('fillAllFields'));
            return;
        }
        setLoading(true);
        try {
            let pictureUrl = null;
            if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const storage = getStorage();
                const storageRef = ref(storage, `event_images/${clubId}/${Date.now()}`);
                await uploadBytes(storageRef, blob);
                pictureUrl = await getDownloadURL(storageRef);
            }

            const eventDateFormatted = date.toISOString().slice(0, 19);
            const questionsPayload = questions
                .filter(q => q.text.trim() !== '')
                .map(q => ({ questionText: q.text, questionType: q.type }));

            await api.post(`/clubs/${clubId}/events`, {
                description,
                location,
                eventDate: eventDateFormatted,
                pictureUrl,
                questions: questionsPayload,
            });
            Alert.alert(t('successTitle'), t('eventCreateSuccess'));
            navigation.goBack();
        } catch (error) {
            console.error("Etkinlik oluşturma hatası:", error.response?.data || error.message);
            Alert.alert(t('errorTitle'), t('eventCreateError'));
        } finally {
            setLoading(false);
        }
    };
    
    const renderQuestionItem = useCallback(({ item, index }) => (
        <View style={styles.questionBlock}>
            <View style={styles.questionHeader}>
                <Text style={styles.questionLabel}>Soru {index + 1}</Text>
                <TouchableOpacity onPress={() => removeQuestion(item.id)}>
                    <Ionicons name="trash-outline" size={22} color="#FF3B30" />
                </TouchableOpacity>
            </View>
            <TextInput
                style={styles.questionInput}
                placeholder={t('questionPlaceholder')}
                value={item.text}
                onChangeText={(text) => updateQuestion(item.id, { text })}
            />
            <View style={styles.pickerContainer}>
                <Picker
                    selectedValue={item.type}
                    onValueChange={(type) => updateQuestion(item.id, { type })}
                >
                    {questionTypes.map(type => (
                        <Picker.Item key={type} label={t(`questionTypes.${type}`)} value={type} />
                    ))}
                </Picker>
            </View>
        </View>
    ), [t, questions]);

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={questions}
                renderItem={renderQuestionItem}
                keyExtractor={(item) => item.id.toString()}
                ListHeaderComponent={
                    <>
                        <Text style={styles.title}>{t('createEventTitle')}</Text>
                        <TouchableOpacity onPress={handleImagePick}>
                            <Image 
                                source={{ uri: imageUri || 'https://placehold.co/600x337/e0e0e0/777?text=Kapak+Fotoğrafı+Ekle' }} 
                                style={styles.previewImage} 
                            />
                        </TouchableOpacity>
                        <TextInput style={styles.input} placeholder={t('eventDescriptionPlaceholder')} value={description} onChangeText={setDescription} multiline />
                        <TextInput style={styles.locationInput} placeholder={t('locationPlaceholder')} value={location} onChangeText={setLocation} />
                        <Text style={styles.label}>{t('eventDateLabel')}</Text>
                        <View style={styles.datePickerContainer}>
                            <TouchableOpacity onPress={() => showMode('date')} style={styles.pickerButton}><Text>{date.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
                            <TouchableOpacity onPress={() => showMode('time')} style={styles.pickerButton}><Text>{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
                        </View>
                        {showPicker && <DateTimePicker value={date} mode={pickerMode} is24Hour={true} onChange={onDateChange} />}
                        <Text style={styles.label}>Form Soruları</Text>
                    </>
                }
                ListFooterComponent={
                    <>
                        <TouchableOpacity style={styles.addButton} onPress={addQuestion}>
                            <Ionicons name="add" size={24} color="#007AFF" />
                            <Text style={styles.addButtonText}>{t('addQuestion')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.button} onPress={handleCreateEvent} disabled={loading}>
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('createEvent')}</Text>}
                        </TouchableOpacity>
                    </>
                }
                contentContainerStyle={styles.scrollView}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollView: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    previewImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 20, backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20, textAlignVertical: 'top' },
    locationInput: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 20 },
    label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
    datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    pickerButton: { alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, width: '48%' },
    questionBlock: { backgroundColor: '#fff', borderRadius: 8, padding: 15, marginBottom: 15, borderWidth: 1, borderColor: '#ddd' },
    questionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    questionLabel: { fontWeight: 'bold', fontSize: 16 },
    questionInput: { height: 50, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, paddingHorizontal: 15, marginBottom: 10 },
    pickerContainer: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
    addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#eef', padding: 15, borderRadius: 8, marginVertical: 10 },
    addButtonText: { marginLeft: 10, color: '#007AFF', fontSize: 16, fontWeight: 'bold' },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default CreateEventScreen;