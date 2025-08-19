import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, SafeAreaView, FlatList, Dimensions, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native'; // -> useFocusEffect eklendi
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route, navigation }) => {
    // 1. Bir önceki ekrandan sadece 'postId' ve yetkiyi al.
    const { postId, canCurrentUserManage } = route.params;
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    // 2. Gönderi verisini tutmak için state'i 'null' ile başlat.
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    // 3. Ekran her açıldığında/odaklandığında, en güncel veriyi sunucudan çek.
    useFocusEffect(
        useCallback(() => {
            const fetchPost = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/posts/${postId}`);
                    setPost(response.data);
                } catch (error) {
                    Alert.alert(t('errorTitle'), "Gönderi yüklenemedi.");
                    navigation.goBack();
                } finally {
                    setLoading(false);
                }
            };
            fetchPost();
        }, [postId])
    );

    if (loading || !post) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.clubName}>{post.club.name}</Text>
                    <Text style={styles.creatorName}>Yayınlayan: {post.creator.name}</Text>
                </View>

                {post.pictureURLs && post.pictureURLs.length > 0 && (
                    <FlatList
                        horizontal
                        data={post.pictureURLs}
                        keyExtractor={(url) => url}
                        renderItem={({ item: url }) => <Image source={{ uri: url }} style={styles.image} />}
                        pagingEnabled
                        showsHorizontalScrollIndicator={false}
                    />
                )}
                
                <View style={styles.content}>
                    <Text style={styles.description}>{post.description}</Text>
                </View>
                
                {canCurrentUserManage && (
                    <TouchableOpacity 
                        style={styles.editButton} 
                        onPress={() => navigation.navigate('EditPost', { post: post })}
                    >
                        <Ionicons name="pencil-outline" size={20} color={theme.primary} />
                        <Text style={styles.editButtonText}>{t('edit')}</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.card },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: theme.border },
    clubName: { fontSize: 18, fontWeight: 'bold', color: theme.text },
    creatorName: { fontSize: 14, color: theme.subtext, marginTop: 4 },
    image: { width: width, height: width },
    content: { padding: 16 },
    description: { fontSize: 16, lineHeight: 24, color: theme.text },
    editButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', margin: 16, paddingVertical: 12, borderWidth: 1, borderColor: theme.primary, borderRadius: 8 },
    editButtonText: { color: theme.primary, fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});

export default PostDetailScreen;
