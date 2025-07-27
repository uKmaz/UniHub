import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Image, TouchableOpacity, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const EventsScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const [upcomingEvents, setUpcomingEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);

    const fetchUpcomingEvents = useCallback(async () => {
        try {
            const response = await api.get('/events/upcoming');
            setUpcomingEvents(response.data);
            setError(null);
        } catch (error) {
            console.error("Yaklaşan etkinlikler çekilemedi:", error);
            setError(t('loadingEventsError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [t]);

    useEffect(() => {
        fetchUpcomingEvents();
    }, [fetchUpcomingEvents]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUpcomingEvents();
    };

    const renderEventItem = ({ item }) => (
        <TouchableOpacity style={styles.eventBlock} onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}>
            <Image source={{ uri: item.clubProfilePictureUrl || 'https://placehold.co/100x100/e0e0e0/777?text=Kulüp' }} style={styles.clubImage} />
            <View style={styles.eventInfo}>
                <Text style={styles.clubName} numberOfLines={1}>{item.clubName}</Text>
                <Text style={styles.eventName} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.eventDate}>{new Date(item.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
        </TouchableOpacity>
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
                data={upcomingEvents}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingVertical: 8 }}
                ListEmptyComponent={<View style={styles.center}><Text>{t('noUpcomingEvents')}</Text></View>}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007AFF']} />}
            />
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: '#f0f2f5' }, center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }, eventBlock: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, marginHorizontal: 16, marginVertical: 6, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center' }, clubImage: { width: 65, height: 65, borderRadius: 10, marginRight: 12, backgroundColor: '#e0e0e0' }, eventInfo: { flex: 1, justifyContent: 'space-between' }, clubName: { fontSize: 16, fontWeight: 'bold', color: '#333' }, eventName: { fontSize: 14, color: '#555', marginVertical: 4 }, eventDate: { fontSize: 12, color: '#888', alignSelf: 'flex-end', marginTop: 4 } });
export default EventsScreen;