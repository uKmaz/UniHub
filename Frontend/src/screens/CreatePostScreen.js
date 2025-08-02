import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Image, Alert, ActivityIndicator, ScrollView, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';
import { auth } from '../services/FirebaseConfig';

const CreatePostScreen = ({ route, navigation }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [imageUris, setImageUris] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleImagePick = async () => {
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images',
                allowsEditing: false,
                quality: 0.7,
                allowsMultipleSelection: true,
            });

            if (!result.canceled && result.assets) {
                const uris = result.assets.map(asset => asset.uri);
                setImageUris(prevUris => [...prevUris, ...uris]);
            }
        } catch (error) {
            console.error("Image picker error:", error);
            Alert.alert("Hata", "Fotoğraf seçici açılamadı.");
        }
    };

    const handleRemoveImage = (uriToRemove) => {
        setImageUris(prevUris => prevUris.filter(uri => uri !== uriToRemove));
    };

    const handleCreatePost = async () => {
        if (!description) {
            Alert.alert(t('errorTitle'), "Lütfen bir açıklama girin.");
            return;
        }
        setLoading(true);
        try {
            const pictureURLs = await Promise.all(
                imageUris.map(async (uri) => {
                    const response = await fetch(uri);
                    const blob = await response.blob();
                    const storage = getStorage();
                    const storageRef = ref(storage, `post_images/${clubId}/${Date.now()}-${Math.random()}`);
                    await uploadBytes(storageRef, blob);
                    return await getDownloadURL(storageRef);
                })
            );

            await api.post(`/clubs/${clubId}/posts`, {
                description,
                pictureURLs,
            });

            Alert.alert(t('successTitle'), t('postCreateSuccess'));
            navigation.goBack();
        } catch (error) {
            console.error("Gönderi oluşturma hatası:", error);
            Alert.alert(t('errorTitle'), t('postCreateError'));
        } finally {
            setLoading(false);
        }
    };
    
    const renderPreviewImage = ({ item }) => (
        <View style={styles.previewImageContainer}>
            <Image source={{ uri: item }} style={styles.previewImage} />
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveImage(item)}>
                <Ionicons name="close-circle" size={24} color="rgba(0,0,0,0.7)" />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>{t('createPostTitle')}</Text>
                <TextInput
                    style={styles.input}
                    placeholder={t('postDescriptionPlaceholder')}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                />
                <TouchableOpacity style={styles.imagePicker} onPress={handleImagePick}>
                    <Ionicons name="images" size={24} color="#007AFF" />
                    <Text style={styles.imagePickerText}>{t('addPhoto')}</Text>
                </TouchableOpacity>

                {imageUris.length > 0 && (
                    <FlatList
                        horizontal
                        data={imageUris}
                        keyExtractor={(item) => item}
                        renderItem={renderPreviewImage}
                        style={{ marginBottom: 20 }}
                        showsHorizontalScrollIndicator={false}
                    />
                )}

                <TouchableOpacity style={styles.button} onPress={handleCreatePost} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{t('sharePost')}</Text>}
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    scrollView: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
    input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 15, fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 20 },
    imagePicker: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#eef', padding: 15, borderRadius: 8, marginBottom: 20 },
    imagePickerText: { marginLeft: 10, color: '#007AFF', fontSize: 16 },
    previewImage: { width: '100%', height: 200, borderRadius: 8, marginBottom: 20 },
    button: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center' },
    buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
    label: { fontSize: 16, color: '#666', marginBottom: 8, marginLeft: 4 },
    previewImage: { width: 100, height: 100, borderRadius: 8, marginRight: 10 },
});

export default CreatePostScreen;