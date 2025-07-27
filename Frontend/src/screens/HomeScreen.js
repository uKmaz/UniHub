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
    RefreshControl
} from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const HomeScreen = () => {
    const { t } = useTranslation();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        fetchPosts();
    }, []);

    const fetchPosts = async () => {
        try {
            const response = await api.get('/feed/posts');
            setPosts(response.data);
            setError(null);
        } catch (err) {
            console.error("Feed çekilirken hata oluştu:", err);
            setError(t('loadingPostsError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchPosts();
    }, []);

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
            {item.pictureURL && (
                <Image source={{ uri: item.pictureURL }} style={styles.postImage} />
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

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    if (error) {
        return <View style={styles.center}><Text>{error}</Text></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<View style={styles.center}><Text>{t('noPostsFound')}</Text></View>}
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
    container: {
        flex: 1,
        backgroundColor: '#f0f2f5',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    postContainer: {
        backgroundColor: '#fff',
        marginVertical: 8,
    },
    postHeader: {
        padding: 12,
    },
    postClubName: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    postImage: {
        width: '100%',
        aspectRatio: 4 / 3,
    },
    postContent: {
        paddingHorizontal: 12,
        paddingTop: 12,
    },
    postDescription: {
        fontSize: 14,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    likeButton: {},
    likeText: {
        fontSize: 16,
        color: '#555',
    },
    likedText: {
        fontSize: 16,
        color: 'red',
        fontWeight: 'bold',
    },
    likeCount: {
        fontSize: 14,
        color: '#888',
    },
});

export default HomeScreen;