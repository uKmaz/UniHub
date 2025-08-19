import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '../services/ApiService';

const EditEventScreen = ({ route, navigation }) => {
    const { event } = route.params;
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [description, setDescription] = useState(event.description);
    const [location, setLocation] = useState(event.location);
    const [date, setDate] = useState(new Date(event.eventDate));
    const [imageUri, setImageUri] = useState(null); 
    const [currentImageUrl, setCurrentImageUrl] = useState(event.pictureUrl);
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerMode, setPickerMode] = useState('date');

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

    const handleUpdate = async () => {
        setLoading(true);
        try {
            let pictureUrlToUpdate = currentImageUrl;
            // Eğer yeni bir resim seçildiyse, onu Firebase'e yükle
            if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const storage = getStorage();
                const storageRef = ref(storage, `event_images/${event.club.id}/${Date.now()}`);
                await uploadBytes(storageRef, blob);
                pictureUrlToUpdate = await getDownloadURL(storageRef);
            }

            const eventDate = date.toISOString().slice(0, 19);
            await api.put(`/events/${event.id}`, { 
                description, 
                location, 
                eventDate,
                pictureUrl: pictureUrlToUpdate // Güncel URL'i gönder
            });
            Alert.alert(t('successTitle'), t('eventUpdateSuccess'));
            navigation.navigate({
                name: 'EventDetail',
                params: { eventId: event.id, updated: true },
                merge: true,
            });
        } catch (error) {
            const errorMessage = error.response?.data?.message || t('eventUpdateError');
            Alert.alert(t('errorTitle'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <TouchableOpacity onPress={handleImagePick}>
                    <Image 
                        source={{ uri: imageUri || currentImageUrl || 'https://placehold.co/600x337' }} 
                        style={styles.previewImage} 
                    />
                </TouchableOpacity>
                <TextInput style={styles.input} value={description} onChangeText={setDescription} multiline />
                <TextInput style={styles.input} value={location} onChangeText={setLocation} />
                <View style={styles.datePickerContainer}>
                    <TouchableOpacity onPress={() => showMode('date')} style={styles.pickerButton}><Text style={styles.pickerButtonText}>{date.toLocaleDateString('tr-TR')}</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => showMode('time')} style={styles.pickerButton}><Text style={styles.pickerButtonText}>{date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
                </View>
                {showPicker && <DateTimePicker value={date} mode={pickerMode} is24Hour={true} onChange={onDateChange} />}
                <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    form: { padding: 20 },
    previewImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 20, backgroundColor: theme.border },
    input: { backgroundColor: theme.card, color: theme.text, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 16, textAlignVertical: 'top' },
    datePickerContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    pickerButton: { alignItems: 'center', backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, borderRadius: 8, padding: 15, width: '48%' },
    pickerButtonText: { color: theme.text, fontSize: 16 },
    button: { backgroundColor: theme.primary, padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default EditEventScreen;