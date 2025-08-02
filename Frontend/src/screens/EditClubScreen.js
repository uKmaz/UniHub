import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import api from '../services/ApiService';

const EditClubScreen = ({ route, navigation }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    const [name, setName] = useState('');
    const [shortName, setShortName] = useState('');
    const [description, setDescription] = useState('');
    const [imageUri, setImageUri] = useState(null);
    const [currentImageUrl, setCurrentImageUrl] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        const fetchClubData = async () => {
            try {
                const response = await api.get(`/clubs/${clubId}`);
                const club = response.data;
                setName(club.name);
                setShortName(club.shortName);
                setDescription(club.description);
                setCurrentImageUrl(club.profilePictureUrl);
            } catch (error) {
                console.error("Kulüp verisi çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchClubData();
    }, [clubId]);

    const validateForm = () => {
        const newErrors = {};
        if (name.length < 3 || name.length > 50) newErrors.name = t('clubNameLength');
        if (shortName.length < 2 || shortName.length > 10) newErrors.shortName = t('clubShortNameLength');
        if (description.length < 10 || description.length > 500) newErrors.description = t('clubDescriptionLength');
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleImagePick = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: 'Images',
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets) {
            setImageUri(result.assets[0].uri);
        }
    };

    const handleUpdate = async () => {
        if (!validateForm()) return;
        setIsUpdating(true);
        try {
            let pictureUrlToUpdate = currentImageUrl;
            if (imageUri) {
                const response = await fetch(imageUri);
                const blob = await response.blob();
                const storage = getStorage();
                const storageRef = ref(storage, `club_pictures/${clubId}/${Date.now()}`);
                await uploadBytes(storageRef, blob);
                pictureUrlToUpdate = await getDownloadURL(storageRef);
            }
            await api.put(`/clubs/${clubId}`, { name, shortName, description, profilePictureUrl: pictureUrlToUpdate });
            Alert.alert(t('successTitle'), t('clubUpdateSuccess'));

        } catch (error) {
            const errorMessage = error.response?.data?.message || t('clubUpdateError');
            Alert.alert(t('errorTitle'), errorMessage);
        } finally {
            setIsUpdating(false);
        }
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <TouchableOpacity onPress={handleImagePick}>
                    <Image source={{ uri: imageUri || currentImageUrl || 'https://placehold.co/150' }} style={styles.clubImage} />
                </TouchableOpacity>
                <TextInput style={styles.input} value={name} onChangeText={setName} placeholder={t('clubNamePlaceholder')} />
                {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
                <TextInput style={styles.input} value={shortName} onChangeText={setShortName} placeholder={t('clubShortNamePlaceholder')} />
                {errors.shortName && <Text style={styles.errorText}>{errors.shortName}</Text>}
                <TextInput style={[styles.input, { height: 120, textAlignVertical: 'top' }]} value={description} onChangeText={setDescription} placeholder={t('clubDescriptionPlaceholder')} multiline />
                {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
                <TouchableOpacity style={styles.buttonContainer} onPress={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('saveChanges')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f5f5f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center' }, form: { padding: 20, alignItems: 'center' }, clubImage: { width: 120, height: 120, borderRadius: 60, marginBottom: 20, backgroundColor: '#e0e0e0' }, input: { width: '100%', backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, marginBottom: 4 }, buttonContainer: { width: '100%', backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 }, buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }, errorText: { color: 'red', alignSelf: 'flex-start', marginLeft: 5, marginBottom: 12 } });
export default EditClubScreen;