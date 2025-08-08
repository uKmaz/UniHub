import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, SafeAreaView, Image, TouchableOpacity, RefreshControl, Switch } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';
import { useTheme } from '../context/ThemeContext';

const EventsScreen = ({ navigation }) => {
    const { t, i18n } = useTranslation();
    const { theme } = useTheme();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
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

    const fetchEvents = useCallback(async () => {
        if (!refreshing) setLoading(true);
        try {
            const response = await api.get(`/feed/events?onlyMemberClubs=${filterMyClubs}`);
            setEvents(response.data);
            setError(null);
        } catch (err) {
            console.error("Etkinlikler çekilemedi:", err);
            setError(t('loadingEventsError'));
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [filterMyClubs, i18n.language, t]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchEvents();
    };
    
    const styles = getEventsStyles(theme);

    const renderEventItem = ({ item }) => (
        <TouchableOpacity 
            style={styles.eventBlock}
            onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        >
            <Image 
                source={{ uri: item.clubProfilePictureUrl || 'https://placehold.co/100x100' }} 
                style={styles.clubImage} 
            />
            <View style={styles.eventInfo}>
                <Text style={styles.clubName} numberOfLines={1}>{item.clubName}</Text>
                <Text style={styles.eventName} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.eventDate}>{new Date(item.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            </View>
        </TouchableOpacity>
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
                data={events}
                renderItem={renderEventItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={{ paddingBottom: 16 }}
                ListEmptyComponent={<View style={styles.center}><Text style={styles.emptyText}>{error ? error : t('noUpcomingEvents')}</Text></View>}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} tintColor={theme.primary} />}
            />
        </SafeAreaView>
    );
};

const getEventsStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 50 },
    emptyText: { color: theme.subtext, fontSize: 16 },
    filterContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, backgroundColor: theme.card, borderBottomWidth: 1, borderBottomColor: theme.border },
    filterText: { fontSize: 16, color: theme.text },
    eventBlock: { flexDirection: 'row', backgroundColor: theme.card, padding: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 12, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, alignItems: 'center' },
    clubImage: { width: 65, height: 65, borderRadius: 10, marginRight: 12, backgroundColor: theme.border },
    eventInfo: { flex: 1, justifyContent: 'space-between' },
    clubName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    eventName: { fontSize: 14, color: theme.subtext, marginVertical: 4 },
    eventDate: { fontSize: 12, color: theme.subtext, alignSelf: 'flex-end', marginTop: 4 },
});

export default EventsScreen;
