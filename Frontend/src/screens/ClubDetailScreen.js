import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    Image, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity, 
    Switch, 
    Alert,
    FlatList 
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';
import { useTheme } from '../context/ThemeContext';

const ClubDetailScreen = ({ route, navigation }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    const [clubDetails, setClubDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const fetchData = useCallback(() => {
        const fetch = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/clubs/${clubId}`);
                setClubDetails(response.data);
            } catch (error) {
                console.error("Kulüp verisi çekilemedi:", error);
                Alert.alert(t('errorTitle'), t('clubLoadError'));
                navigation.goBack();
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, [clubId, navigation, t]);

    useFocusEffect(fetchData);

    const membership = clubDetails?.currentUserMembership;
    const isMember = membership?.status === 'APPROVED';
    const isPending = membership?.status === 'PENDING';
    const canManage = isMember && (membership.role === 'OWNER' || membership.role === 'MANAGER');

    const handlePostPress = (post) => {
        const safeDescription = (post?.description || '').substring(0, 50) + '...';
        const options = [{
            text: t('viewPost'),
            onPress: () => navigation.navigate('PostDetail', { 
                postId: post.id, 
                canCurrentUserManage: canManage 
            }),
        }];

        if (canManage) {
            options.push({
                text: t('deletePost'),
                style: 'destructive',
                onPress: () => confirmDeletePost(post),
            });
        }
        options.push({ text: t('cancel'), style: 'cancel' });
        Alert.alert(t('postOptionsTitle'), safeDescription, options);
    };

    const confirmDeletePost = (postToDelete) => {
        Alert.alert(
            t('confirmDeletePostTitle'),
            t('confirmDeletePostMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/posts/${postToDelete.id}`);
                            setClubDetails(currentDetails => {
                                if (!currentDetails) return null;
                                const updatedPosts = currentDetails.posts.filter(
                                    post => post.id !== postToDelete.id
                                );
                                return { ...currentDetails, posts: updatedPosts };
                            });
                            Alert.alert(t('successTitle'), t('postDeleteSuccess'));
                        } catch (error) {
                            console.error("Post silinemedi:", error);
                            Alert.alert(t('errorTitle'), t('postDeleteError'));
                        }
                    },
                },
            ]
        );
    };

    const handleNotificationToggle = async (type, value) => {
        const originalMembership = clubDetails.currentUserMembership;
        const newMembership = { ...originalMembership, [`${type}NotificationsEnabled`]: value };
        
        setClubDetails(prev => ({ ...prev, currentUserMembership: newMembership }));

        try {
            await api.put(`/clubs/${clubId}/notifications`, {
                eventNotificationsEnabled: type === 'event' ? value : originalMembership.eventNotificationsEnabled,
                postNotificationsEnabled: type === 'post' ? value : originalMembership.postNotificationsEnabled,
            });
        } catch (error) {
            console.error("Bildirim ayarı güncellenemedi:", error);
            setClubDetails(prev => ({ ...prev, currentUserMembership: originalMembership }));
        }
    };

    const handleJoinClub = async () => {
        setLoading(true);
        try {
            await api.post(`/clubs/${clubId}/join`);
            Alert.alert(t('successTitle'), t('joinSuccessMessage'));
            setClubDetails(prevDetails => ({
                ...prevDetails,
                currentUserMembership: {
                    status: 'PENDING',
                    role: 'MEMBER',
                    eventNotificationsEnabled: true,
                    postNotificationsEnabled: true,
                    clubId: clubId,
                }
            }));
        } catch (error) {
            Alert.alert(t('errorTitle'), error.response?.data?.message || t('joinErrorMessage'));
        } finally {
            setLoading(false);
        }
    };

    const handleWithdrawRequest = () => {
        Alert.alert(
            t('withdrawRequestTitle'),
            t('withdrawRequestMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('withdraw'),
                    style: 'destructive',
                    onPress: async () => {
                        setLoading(true);
                        try {
                            await api.delete(`/clubs/${clubId}/join`);
                            Alert.alert(t('successTitle'), t('withdrawRequestSuccess'));
                            setClubDetails(prevDetails => ({
                                ...prevDetails,
                                currentUserMembership: null
                            }));
                        } catch (error) {
                            Alert.alert(t('errorTitle'), t('withdrawRequestError'));
                            Console.log(error);
                            Console.log("LOGG ####################");
                        } finally {
                            setLoading(false);
                        }
                    },
                },
            ]
        );
    };

    const handleLeaveClub = () => {
        Alert.alert(
            t('leaveClubConfirmTitle'),
            t('leaveClubConfirmMessage', { clubName: clubDetails.name }),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('leaveClub'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/clubs/${clubId}/leave`);
                            Alert.alert(t('successTitle'), t('leaveClubSuccess'));
                            navigation.goBack();
                        } catch (error) {
                            const errorMessage = error.response?.data?.message === "Kulüp sahibi kulüpten ayrılamaz." 
                                ? t('ownerCannotLeaveError') 
                                : t('leaveClubError');
                            Alert.alert(t('errorTitle'), errorMessage);
                        }
                    },
                },
            ]
        );
    };

    const renderPostItem = ({ item }) => (
        <TouchableOpacity style={styles.postItem} onPress={() => handlePostPress(item)}>
            {item.pictureURLs && item.pictureURLs.length > 0 &&
                <Image source={{ uri: item.pictureURLs[0] }} style={styles.postImage} />
            }
            <Text style={styles.postDescription} numberOfLines={3}>{item.description}</Text>
        </TouchableOpacity>
    );

    const renderEventItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.eventItem} 
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        >
            <Image source={{ uri: item.clubProfilePictureUrl || 'https://placehold.co/100' }} style={styles.eventImage} />
            <View style={styles.eventInfo}>
                <Text style={styles.eventName} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.eventDate}>
                    {new Date(item.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                </Text>
            </View>
        </TouchableOpacity>
    );

    if (loading || !clubDetails) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.headerContainer}>
                    <Image source={{ uri: clubDetails.profilePictureUrl || 'https://placehold.co/150' }} style={styles.clubImage} />
                    <Text style={styles.clubName}>{clubDetails.name}</Text>
                    <Text style={styles.clubShortName}>({clubDetails.shortName})</Text>
                    <Text style={styles.clubDescription}>{clubDetails.description}</Text>
                </View>

                <View>
                    {!membership && (
                        <TouchableOpacity style={styles.joinButton} onPress={handleJoinClub}>
                            <Ionicons name="enter-outline" size={20} color="white" />
                            <Text style={styles.joinButtonText}>{t('joinClub')}</Text>
                        </TouchableOpacity>
                    )}

                    {isPending && (
                        <TouchableOpacity style={[styles.joinButton, styles.pendingButton]} onPress={handleWithdrawRequest}>
                            <Ionicons name="close-circle-outline" size={22} color={theme.destructive} />
                            <Text style={styles.pendingButtonText}>{t('withdrawRequest')}</Text>
                        </TouchableOpacity>
                    )}

                    {isMember && (
                        <>
                            <View style={styles.notificationSection}>
                                <View style={styles.notificationRow}>
                                    <Ionicons name="notifications-outline" size={20} color={theme.subtext} />
                                    <Text style={styles.notificationText}>{t('postNotifications')}</Text>
                                    <Switch value={membership.postNotificationsEnabled} onValueChange={(value) => handleNotificationToggle('post', value)} />
                                </View>
                                <View style={styles.notificationRow}>
                                    <Ionicons name="calendar-outline" size={20} color={theme.subtext} />
                                    <Text style={styles.notificationText}>{t('eventNotifications')}</Text>
                                    <Switch value={membership.eventNotificationsEnabled} onValueChange={(value) => handleNotificationToggle('event', value)} />
                                </View>
                            </View>
                            
                            {canManage && (
                                <TouchableOpacity 
                                    style={styles.panelButton}
                                    onPress={() => navigation.navigate('ClubManagement', { 
                                        clubId: clubDetails.id,
                                        clubName: clubDetails.name 
                                    })}
                                >
                                    <Ionicons name="cog" size={20} color="white" />
                                    <Text style={styles.panelButtonText}>{t('managementPanel')}</Text>
                                </TouchableOpacity>
                            )}

                            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClub}>
                                <Ionicons name="exit-outline" size={20} color={theme.destructive} />
                                <Text style={styles.leaveButtonText}>{t('leaveClub')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                <View style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>{t('posts')}</Text>
                    <FlatList
                        horizontal
                        data={clubDetails.posts}
                        renderItem={renderPostItem}
                        keyExtractor={(item) => `post-${item.id}`}
                        style={styles.horizontalList}
                        showsHorizontalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyContentText}>{t('noPostsInClub')}</Text>}
                    />
                </View>

                <View style={styles.contentSection}>
                    <Text style={styles.sectionTitle}>{t('events')}</Text>
                    <FlatList
                        horizontal
                        data={clubDetails.events}
                        renderItem={renderEventItem}
                        keyExtractor={(item) => `event-${item.id}`}
                        style={styles.horizontalList}
                        showsHorizontalScrollIndicator={false}
                        ListEmptyComponent={<Text style={styles.emptyContentText}>{t('noEventsInClub')}</Text>}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { backgroundColor: theme.card, alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: theme.border },
    clubImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: theme.primary, marginBottom: 10 },
    clubName: { fontSize: 24, fontWeight: 'bold', color: theme.text },
    clubShortName: { fontSize: 16, color: theme.subtext, marginBottom: 8 },
    clubDescription: { fontSize: 15, color: theme.subtext, textAlign: 'center', marginTop: 8 },
    notificationSection: { backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16, borderRadius: 12, paddingVertical: 8 },
    notificationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    notificationText: { flex: 1, fontSize: 16, marginLeft: 12, color: theme.text },
    panelButton: { flexDirection: 'row', backgroundColor: '#4CAF50', margin: 16, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    panelButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    joinButton: { flexDirection: 'row', backgroundColor: theme.primary, margin: 16, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    joinButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    pendingButton: { backgroundColor: theme.card, borderWidth: 1, borderColor: theme.destructive },
    pendingButtonText: { color: theme.destructive, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    contentSection: { marginTop: 10, minHeight: 220 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8, color: theme.text },
    horizontalList: { paddingLeft: 16 },
    postItem: { backgroundColor: theme.card, borderRadius: 12, width: 250, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    postImage: { width: '100%', height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    postDescription: { padding: 10, fontSize: 14, color: theme.text },
    eventItem: { backgroundColor: theme.card, borderRadius: 12, width: 180, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, padding: 10 },
    eventImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8, backgroundColor: theme.border },
    eventInfo: { flex: 1 },
    eventName: { fontWeight: 'bold', fontSize: 14, color: theme.text },
    eventDate: { fontSize: 12, color: theme.subtext, marginTop: 4 },
    emptyContentText: { marginLeft: 16, color: theme.subtext },
    leaveButton: { flexDirection: 'row', backgroundColor: theme.card, marginHorizontal: 16, marginTop: 16, marginBottom: 24, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.destructive },
    leaveButtonText: { color: theme.destructive, fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
});

export default ClubDetailScreen;
