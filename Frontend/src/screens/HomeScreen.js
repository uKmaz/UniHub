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
import Autolink from 'react-native-autolink'; // -> YENİ IMPORT
import api from '../services/ApiService';
import { useTheme } from '../context/ThemeContext';

const { width } = Dimensions.get('window');

const HomeScreen = () => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshing, setRefreshing] = useState(false);
    const [filterMyClubs, setFilterMyClubs] = useState(false);
    const [key, setKey] = useState(0);

    useEffect(() => {
        const onLanguageChanged = () => {
            setKey(prevKey => prevKey + 1);
        };
        i18n.on('languageChanged', onLanguageChanged);

        return () => {
            i18n.off('languageChanged', onLanguageChanged);
        };
    }, [i18n]);

    const fetchPosts = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
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
    }, [filterMyClubs, i18n.language, t]);

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
                    return { ...post, isLikedByCurrentUser: !post.isLikedByCurrentUser, likeCount: post.isLikedByCurrentUser ? post.likeCount - 1 : post.likeCount + 1 };
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
    
    const styles = getStyles(theme);

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
                    renderItem={({ item: url }) => <Image source={{ uri: url }} style={styles.postImage} />}
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                />
            )}
            
            <View style={styles.postContent}>
                {/* --- DEĞİŞİKLİK BURADA --- */}
                {/* Standart Text yerine Autolink kullanıyoruz */}
                <Autolink
                    text={item.description}
                    style={styles.postDescription}
                    linkStyle={{ color: theme.primary }} // Linklerin rengini temadan al
                />
                {/* ------------------------- */}
            </View>

            <View style={styles.actionsContainer}>
                <TouchableOpacity onPress={() => handleToggleLike(item.id)} style={styles.likeButton}>
                    <Text style={item.isLikedByCurrentUser ? styles.likedText : styles.likeText}>❤️ {t('like')}</Text>
                </TouchableOpacity>
                <Text style={styles.likeCount}>{t('likes', { count: item.likeCount })}</Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                key={key}
                ListHeaderComponent={
                    <View style={styles.filterContainer}>
                        <Text style={styles.filterText}>{t('filterMyClubs')}</Text>
                        <Switch value={filterMyClubs} onValueChange={setFilterMyClubs} trackColor={{ false: "#767577", true: theme.primary }} thumbColor={"#f4f3f4"} />
                    </View>
                }
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id.toString()}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{error ? error : t('noPostsFound')}</Text></View>}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
            />
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background, paddingTop: 50 },
    emptyText: { color: theme.subtext, fontSize: 16 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    filterText: { fontSize: 16, color: theme.text },
    postContainer: { backgroundColor: theme.card, marginVertical: 8 },
    postHeader: { padding: 12 },
    postClubName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    postImage: { width: width, height: width },
    postContent: { padding: 12 },
    postDescription: { fontSize: 14, color: theme.text, lineHeight: 20 }, // Satır aralığı eklendi
    actionsContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: theme.border },
    likeButton: {},
    likeText: { fontSize: 16, color: theme.subtext },
    likedText: { fontSize: 16, color: theme.destructive, fontWeight: 'bold' },
    likeCount: { fontSize: 14, color: theme.subtext },
});

export default HomeScreen;