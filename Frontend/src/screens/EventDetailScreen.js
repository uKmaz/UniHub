import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator, TouchableOpacity, Alert, Image, Linking } from 'react-native'; 
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';

const EventDetailScreen = ({ route }) => {
    const { eventId } = route.params;
    const { t } = useTranslation();
    const navigation = useNavigation();
    const [eventDetails, setEventDetails] = useState(null);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
    useCallback(() => {
        const fetchData = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/events/${eventId}`);
            setEventDetails(response.data);
        } catch (error) {
            console.error("Etkinlik detayı çekilemedi:", error);
        } finally {
            setLoading(false);
        }
        };

        fetchData();

        // Explicitly return undefined to avoid any implicit Promise return
        return; // or return undefined;
    }, [eventId])
    );


    const handleOpenMap = () => {
        const locationQuery = encodeURIComponent(eventDetails.location);
        const url = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
        Linking.openURL(url).catch(err => console.error("Harita açılamadı", err));
    };


    const handleAttend = async () => {
        try {
            if (eventDetails.formQuestions && eventDetails.formQuestions.length > 0) {
                navigation.navigate('EventForm', {
                    eventId: eventDetails.id,
                    questions: eventDetails.formQuestions
                });
            } else {
                await api.post(`/events/${eventId}/attend`);
                Alert.alert(t('successTitle'), t('eventAttendSuccess'));
                fetchData();
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), error.response?.data?.message || t('eventAttendError'));
        }
    };

    const handleLeave = async () => {
        try {
            await api.delete(`/events/${eventId}/leave`);
            fetchData();
        } catch (error) {
            Alert.alert(t('errorTitle'), "Etkinlikten ayrılırken bir sorun oluştu.");
        }
    };

    const handleDeleteEvent = () => {
        Alert.alert(
            t('confirmDeleteEventTitle'),
            t('confirmDeleteEventMessage'),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('delete'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/events/${eventId}`);
                            Alert.alert(t('successTitle'), t('eventDeleteSuccess'));
                            navigation.goBack();
                        } catch (error) {
                            console.error("Etkinlik silinemedi:", error);
                            Alert.alert(t('errorTitle'), t('eventDeleteError'));
                        }
                    },
                },
            ]
        );
    };

    if (loading || !eventDetails) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    const { isCurrentUserAttending, canCurrentUserManage, attendeeCount, isCurrentUserMemberOfClub } = eventDetails;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Image source={{ uri: eventDetails.pictureURL || 'https://placehold.co/600x400' }} style={styles.eventImage} />
                <View style={styles.content}>
                    <Text style={styles.title}>{eventDetails.description}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={16} color="gray" />
                        <Text style={styles.infoText}>{eventDetails.club.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color="gray" />
                        <Text style={styles.infoText}>
                            {new Date(eventDetails.eventDate).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
                        </Text>
                    </View>
                    {eventDetails.location && (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color="gray" />
                            <Text style={styles.infoText}>{eventDetails.location}</Text>
                        </View>
                    )}
                </View>
                

                <View style={styles.actionsContainer}>
                    {eventDetails.location && (
                        
                         <TouchableOpacity style={[styles.actionButton, styles.mapButton]} onPress={handleOpenMap}>
                            <Ionicons name="map-outline" size={20} color="white" />
                            <Text style={styles.buttonText}>{t('viewOnMap')}</Text>
                        </TouchableOpacity>
                        
                    )}
                    {isCurrentUserMemberOfClub ? (
                        isCurrentUserAttending ? (
                            <TouchableOpacity style={[styles.actionButton, styles.leaveButton]} onPress={handleLeave}>
                                <Text style={styles.buttonText}>Katılıyorum (Ayrıl)</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={[styles.actionButton, styles.attendButton]} onPress={handleAttend}>
                                <Text style={styles.buttonText}>{t('attendEventButton')}</Text>
                            </TouchableOpacity>
                        )
                    ) : (
                        <View style={styles.notMemberContainer}>
                            <Text style={styles.notMemberText}>{t('notAMember')}</Text>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.joinClubButton]}
                                onPress={() => navigation.navigate('ClubDetail', { clubId: eventDetails.club.id })}
                            >
                                <Text style={styles.buttonText}>{t('joinClubToAttend')}</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {canCurrentUserManage && (
                        <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteEvent}>
                            <Text style={styles.buttonText}>{t('deleteEvent')}</Text>
                        </TouchableOpacity>
                    )}
                </View>
                
                <View style={styles.attendeesSection}>
                    <Text style={styles.sectionTitle}>{t('attendeeCount', { count: attendeeCount })}</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: 'white' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    eventImage: { width: '100%', height: 250 },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    infoText: { fontSize: 16, color: '#555', marginLeft: 8 },
    actionsContainer: { paddingHorizontal: 20, marginTop: 20, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 20 },
    actionButton: { padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    attendButton: { backgroundColor: '#007AFF' },
    leaveButton: { backgroundColor: '#34C759' },
    deleteButton: { backgroundColor: '#FF3B30' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    notMemberContainer: { alignItems: 'center', padding: 20, backgroundColor: '#fff3cd', borderRadius: 10, marginHorizontal: 20 },
    notMemberText: { color: '#856404', textAlign: 'center', marginBottom: 15, fontSize: 16 },
    joinClubButton: { backgroundColor: '#ffc107' },
    attendeesSection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    actionButton: { flexDirection: 'row', justifyContent: 'center', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    mapButton: { backgroundColor: '#34C759' }, // Yeşil renk
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
});

export default EventDetailScreen;