import React, { useState, useEffect, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    FlatList, 
    ActivityIndicator, 
    SafeAreaView, 
    Image, 
    TouchableOpacity,
    RefreshControl,
    Dimensions,
    Switch
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [filterMyClubs, setFilterMyClubs] = useState(false); // Filtre state'i

    const fetchPosts = useCallback(async () => {
        // Yenileme başlamıyorsa ana yüklemeyi göster
        if (!refreshing) {
            setLoading(true);
        }
        try {
            // API isteğine filtre parametresini ekliyoruz
            const response = await api.get(`/feed/posts?onlyMemberClubs=${filterMyClubs}`);
            setPosts(response.data);
            setError(null);
        } catch (err) {
            console.error("Feed çekilirken hata oluştu:", err);
            setError(t('loadingPostsError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterMyClubs, t]); // Filtre veya dil değiştiğinde fonksiyon yeniden oluşur

    // Filtre durumu değiştiğinde verileri yeniden çek
    useEffect(() => {
        fetchPosts();
    }, [fetchPosts]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchPosts();
    };

    const handleToggleLike = async (postId) => {
        setPosts(currentPosts => 
            currentPosts.map(post => {
                if (post.id === postId) {
                    return {
                        ...post,
                        isLikedByCurrentUser: !post.isLikedByCurrentUser,
                        likeCount: post.isLikedByCurrentUser ? post.likeCount - 1 : post.likeCount + 1
                    };
                }
                return post;
            })
        );
        try {
            await api.post(`/posts/${postId}/toggle-like`);
        } catch (err) {
            console.error("Like işlemi başarısız:", err);
            fetchPosts(); 
        }
    };

    const renderPost = ({ item }) => (
        <View style={styles.postContainer}>
            <View style={styles.postHeader}>
                <Text style={styles.postClubName}>{item.clubName}</Text>
            </View>
            
            {item.pictureURLs && item.pictureURLs.length > 0 && (
                <FlatList
                    horizontal
                    data={item.pictureURLs}
                    keyExtractor={(url, index) => `${item.id}-image-${index}`}
                    renderItem={({ item: url }) => (
                        <Image source={{ uri: url }} style={styles.postImage} />
                    )}
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />
            )}
            
            <View style={styles.postContent}>
                <Text style={styles.postDescription}>{item.description}</Text>
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={styles.likeButton}>
                    <Text style={item.isLikedByCurrentUser ? styles.likedText : styles.likeText}>
                        ❤️ {t('like')}
                    </Text>
                </TouchableOpacity>
                <Text style={styles.likeCount}>{t('likes', { count: item.likeCount })}</Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                ListHeaderComponent={
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterText}>{t('filterMyClubs')}</Text>
                        <Switch
                            value={filterMyClubs}
                            onValueChange={setFilterMyClubs}
                        />
                    </View>
                }
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text>{error ? error : t('noPostsFound')}</Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#007AFF']}
                    />
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'white', borderBottomWidth: 1, borderBottomColor: '#eee' },
    filterText: { fontSize: 16 },
    postContainer: { backgroundColor: '#fff', marginVertical: 8 },
    postHeader: { padding: 12 },
    postClubName: { fontSize: 16, fontWeight: 'bold' },
    postImage: { width: width, height: width },
    postContent: { padding: 12 },
    postDescription: { fontSize: 14 },
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#eee' },
    likeButton: {},
    likeText: { fontSize: 16, color: '#555' },
    likedText: { fontSize: 16, color: 'red', fontWeight: 'bold' },
    likeCount: { fontSize: 14, color: '#888' },
});

export default HomeScreen;