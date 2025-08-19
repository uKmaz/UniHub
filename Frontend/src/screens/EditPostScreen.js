import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, SafeAreaView, TouchableOpacity, Alert, ActivityIndicator, ScrollView, Image, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import api from '../services/ApiService';
import * as ImagePicker from 'expo-image-picker';
import Ionicons from '@expo/vector-icons/Ionicons';
// --- Firebase Storage'a resim yüklemek için bu importları ekle ---
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../services/FirebaseConfig'; // Firebase ayar dosyanızın yolu

const EditPostScreen = ({ route, navigation }) => {
    const { post } = route.params;
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const storage = getStorage(app);

    const [description, setDescription] = useState(post.description);
    const [images, setImages] = useState(post.pictureURLs || []); 
    const [imagesToDelete, setImagesToDelete] = useState([]);
    const [loading, setLoading] = useState(false);

    const verifyPermissions = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('permissionRequired'), t('galleryPermissionInfo'));
            return false;
        }
        return true;
    };

    const handleAddImage = async () => {
        const hasPermission = await verifyPermissions();
        if (!hasPermission) return;

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsMultipleSelection: true,
            quality: 0.7,
        });

        if (!result.canceled) {
            const newImageUris = result.assets.map(asset => asset.uri);
            setImages([...images, ...newImageUris]);
        }
    };

    const handleDeleteImage = (uriToDelete) => {
        if (uriToDelete.startsWith('http')) {
            setImagesToDelete([...imagesToDelete, uriToDelete]);
        }
        setImages(images.filter(imgUri => imgUri !== uriToDelete));
    };

    // --- YENİ: Firebase'e resim yükleyen yardımcı fonksiyon ---
    const uploadImageAsync = async (uri) => {
        const blob = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.onload = function () { resolve(xhr.response); };
            xhr.onerror = function (e) { reject(new TypeError("Network request failed")); };
            xhr.responseType = "blob";
            xhr.open("GET", uri, true);
            xhr.send(null);
        });

        const fileRef = ref(storage, `posts/${post.club.id}/${Date.now()}-${Math.random()}`);
        await uploadBytes(fileRef, blob);
        blob.close();
        return await getDownloadURL(fileRef);
    };

    // --- DÜZELTME: handleUpdate fonksiyonu artık JSON gönderiyor ---
    const handleUpdate = async () => {
        setLoading(true);
        try {
            const uploadPromises = images
                .filter(uri => !uri.startsWith('http')) // Sadece yeni, lokal resimleri seç
                .map(uri => uploadImageAsync(uri)); // Her biri için bir yükleme promise'i oluştur

            const newlyUploadedURLs = await Promise.all(uploadPromises);

            const existingImageURLs = images.filter(uri => uri.startsWith('http'));

            // 2. Backend'e gönderilecek JSON payload'ını oluştur
            const payload = {
                description: description,
                pictureURLs: [...existingImageURLs, ...newlyUploadedURLs],
                imagesToDelete: imagesToDelete,
            };
            
            // 3. API isteğini gönder
            await api.put(`/posts/${post.id}`, payload);

            Alert.alert(t('successTitle'), t('postUpdateSuccess'));
            navigation.navigate('PostDetail', { postId: post.id, updated: true });

        } catch (error) {
            const errorMessage = error.response?.data?.message || t('postUpdateError');
            Alert.alert(t('errorTitle'), errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const renderImageItem = ({ item }) => (
        <View style={styles.imageContainer}>
            <Image source={{ uri: item }} style={styles.image} />
            <TouchableOpacity style={styles.deleteIcon} onPress={() => handleDeleteImage(item)}>
                <Ionicons name="close-circle" size={24} color={theme.destructive} />
            </TouchableOpacity>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <TextInput
                    style={styles.input}
                    value={description}
                    onChangeText={setDescription}
                    placeholder={t('postDescriptionPlaceholder')}
                    multiline
                />
                <FlatList
                    data={images}
                    renderItem={renderImageItem}
                    keyExtractor={(item, index) => item + index}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.imagePreviewList}
                    ListFooterComponent={
                        <TouchableOpacity style={styles.addPhotoButton} onPress={handleAddImage}>
                            <Ionicons name="add" size={30} color={theme.primary} />
                        </TouchableOpacity>
                    }
                />
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
    input: { 
        backgroundColor: theme.card, 
        color: theme.text, 
        borderWidth: 1, 
        borderColor: theme.border, 
        borderRadius: 8, 
        padding: 15, 
        fontSize: 16, 
        minHeight: 150, 
        textAlignVertical: 'top' 
    },
    imagePreviewList: {
        marginVertical: 20,
    },
    imageContainer: {
        position: 'relative',
        marginRight: 10,
    },
    image: {
        width: 100,
        height: 100,
        borderRadius: 8,
        backgroundColor: theme.border,
    },
    deleteIcon: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: theme.card,
        borderRadius: 12,
    },
    addPhotoButton: {
        width: 100,
        height: 100,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: theme.border,
        borderStyle: 'dashed',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: theme.card,
    },
    button: { 
        backgroundColor: theme.primary, 
        padding: 15, 
        borderRadius: 8, 
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default EditPostScreen;
