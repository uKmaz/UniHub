import React from 'react';
import { View, Text, Image, ScrollView, StyleSheet, SafeAreaView, FlatList, Dimensions } from 'react-native';
import { useTranslation } from 'react-i18next';

const { width } = Dimensions.get('window');

const PostDetailScreen = ({ route }) => {
    const { post } = route.params; // Bir önceki ekrandan tüm gönderi objesini alıyoruz
    const { t } = useTranslation();

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.clubName}>{post.clubName}</Text>
                    <Text style={styles.creatorName}>Yayınlayan: {post.creatorName}</Text>
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
                {/* Buraya like ve comment bölümü eklenebilir */}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    header: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
    clubName: { fontSize: 18, fontWeight: 'bold' },
    creatorName: { fontSize: 14, color: 'gray', marginTop: 4 },
    image: { width: width, height: width },
    content: { padding: 16 },
    description: { fontSize: 16, lineHeight: 24 },
});

export default PostDetailScreen;