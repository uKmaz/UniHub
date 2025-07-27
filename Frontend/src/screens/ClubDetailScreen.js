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

const ClubDetailScreen = ({ route, navigation }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    const [clubDetails, setClubDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentUserMembership, setCurrentUserMembership] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [clubRes, profileRes] = await Promise.all([
                        api.get(`/clubs/${clubId}`),
                        api.get('/users/me')
                    ]);
                    setClubDetails(clubRes.data);
                    const membership = profileRes.data.memberships?.find(m => m.clubId === clubId);
                    setCurrentUserMembership(membership);
                } catch (error) {
                    console.error("Veri çekilemedi:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [clubId])
    );

    const handleNotificationToggle = async (type, value) => {
        // Arayüzü anında güncelle (Optimistic Update)
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
            // Hata durumunda arayüzü eski haline geri döndür
            setClubDetails(prev => ({ ...prev, currentUserMembership: originalMembership }));
        }
    };

    const handleJoinClub = async () => {
        setLoading(true);
        try {
            await api.post(`/clubs/${clubId}/join`);
            Alert.alert(t('successTitle'), t('joinSuccessMessage'));
            fetchData(); // Ekranı yeni üyelik durumuyla güncelle
        } catch (error) {
            Alert.alert(t('errorTitle'), error.response?.data?.message || t('joinErrorMessage'));
        } finally {
            setLoading(false);
        }
    };

    // Yükleniyor durumu
    if (loading || !clubDetails) {
        return <View style={styles.center}><ActivityIndicator size="large" color="#007AFF" /></View>;
    }

    // Gerekli durumları tek bir yerden alıyoruz
    const membership = clubDetails.currentUserMembership;
    const isMember = membership?.status === 'APPROVED';
    const isPending = membership?.status === 'PENDING';
    const canManage = isMember && (membership.role === 'OWNER' || membership.role === 'MANAGER');

    // Gönderi ve Etkinlikler için render fonksiyonları
    const renderPostItem = ({ item }) => (
        <TouchableOpacity style={styles.postItem}>
            {item.pictureURL && <Image source={{ uri: item.pictureURL }} style={styles.postImage} />}
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                {/* Header */}
                <View style={styles.headerContainer}>
                    <Image source={{ uri: clubDetails.profilePictureUrl || 'https://placehold.co/150' }} style={styles.clubImage} />
                    <Text style={styles.clubName}>{clubDetails.name}</Text>
                    <Text style={styles.clubDescription}>{clubDetails.description}</Text>
                </View>

                {/* Katılma Butonu (üye değilse) */}
                {!membership && (
                    <TouchableOpacity style={styles.joinButton} onPress={handleJoinClub}>
                        <Ionicons name="enter-outline" size={20} color="white" />
                        <Text style={styles.joinButtonText}>{t('joinClub')}</Text>
                    </TouchableOpacity>
                )}

                {/* Beklemede Uyarısı */}
                {isPending && (
                    <View style={[styles.joinButton, styles.pendingButton]}>
                        <Ionicons name="time-outline" size={20} color="#333" />
                        <Text style={styles.pendingButtonText}>{t('requestSent')}</Text>
                    </View>
                )}

                {/* Bildirim Ayarları (üye ise) */}
                {(
                    <View style={styles.notificationSection}>
                        <View style={styles.notificationRow}>
                            <Ionicons name="notifications-outline" size={20} color="#555" />
                            <Text style={styles.notificationText}>{t('postNotifications')}</Text>
                            <Switch value={membership.postNotificationsEnabled} onValueChange={(value) => handleNotificationToggle('post', value)} />
                        </View>
                        <View style={styles.notificationRow}>
                            <Ionicons name="calendar-outline" size={20} color="#555" />
                            <Text style={styles.notificationText}>{t('eventNotifications')}</Text>
                            <Switch value={membership.eventNotificationsEnabled} onValueChange={(value) => handleNotificationToggle('event', value)} />
                        </View>
                    </View>
                )}

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

                {/* Gönderi Listesi */}
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

                {/* Etkinlik Listesi */}
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

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    headerContainer: { backgroundColor: 'white', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
    clubImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 4, borderColor: '#007AFF', marginBottom: 10 },
    clubName: { fontSize: 24, fontWeight: 'bold' },
    clubDescription: { fontSize: 14, color: '#666', textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
    notificationSection: { backgroundColor: 'white', marginHorizontal: 16, marginTop: 16, borderRadius: 12, paddingVertical: 8 },
    notificationRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
    notificationText: { flex: 1, fontSize: 16, marginLeft: 12 },
    panelButton: { flexDirection: 'row', backgroundColor: '#4CAF50', margin: 16, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    panelButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    joinButton: { flexDirection: 'row', backgroundColor: '#007AFF', margin: 16, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    joinButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    pendingButton: { backgroundColor: '#e0e0e0' },
    pendingButtonText: { color: '#333', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    contentSection: { marginTop: 10, minHeight: 220 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', paddingHorizontal: 16, marginBottom: 8 },
    horizontalList: { paddingLeft: 16 },
    postItem: { backgroundColor: 'white', borderRadius: 12, width: 250, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    postImage: { width: '100%', height: 120, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
    postDescription: { padding: 10, fontSize: 14 },
    eventItem: { backgroundColor: 'white', borderRadius: 12, width: 180, marginRight: 12, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, padding: 10 },
    eventImage: { width: '100%', height: 80, borderRadius: 8, marginBottom: 8 },
    eventInfo: { flex: 1 },
    eventName: { fontWeight: 'bold', fontSize: 14 },
    eventDate: { fontSize: 12, color: '#888', marginTop: 4 },
    emptyContentText: { marginLeft: 16, color: '#888' }
});

export default ClubDetailScreen;
