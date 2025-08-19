import React, { useState, useCallback, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    ScrollView, 
    ActivityIndicator, 
    TouchableOpacity, 
    Alert, 
    Image, 
    Linking 
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/ApiService';

const EventDetailScreen = ({ route }) => {
    const { eventId } = route.params;
    const { t } = useTranslation();
    const navigation = useNavigation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

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
                    Alert.alert(t('errorTitle'), "Etkinlik yüklenemedi.");
                    navigation.goBack();
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [eventId, t, navigation])
    );
    // ---------------------------------------------

    // Düzenleme veya form gönderme ekranlarından geri dönüldüğünde veriyi yenile
    useEffect(() => {
        if (route.params?.updated) {
            const fetchData = async () => {
                const response = await api.get(`/events/${eventId}`);
                
                setEventDetails(response.data);
            };
            fetchData();
            navigation.setParams({ updated: false });
        }
    }, [route.params?.updated, eventId, navigation]);

    const handleAttend = async () => {
        try {
            if (eventDetails.formQuestions && eventDetails.formQuestions.length > 0) {
                navigation.navigate('EventForm', {
                    eventId: eventDetails.id,
                    questions: eventDetails.formQuestions,
                    onFormSubmit: () => navigation.navigate({ name: 'EventDetail', params: { updated: true }, merge: true })
                });
            } else {
                await api.post(`/events/${eventId}/attend`);
                Alert.alert(t('successTitle'), t('eventAttendSuccess'));
                const response = await api.get(`/events/${eventId}`);
                setEventDetails(response.data);
            }
        } catch (error) {
            Alert.alert(t('errorTitle'), error.response?.data?.message || t('eventAttendError'));
        }
    };

    const handleLeave = async () => {
        try {
            await api.delete(`/events/${eventId}/leave`);
            Alert.alert(t('successTitle'), t('eventLeaveSuccess'));
            const response = await api.get(`/events/${eventId}`);
            setEventDetails(response.data);
        } catch (error) {
            Alert.alert(t('errorTitle'), t('eventLeaveFail'));
        }
    };

    const handleDeleteEvent = () => {
        Alert.alert(t('confirmDeleteEventTitle'), t('confirmDeleteEventMessage'), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('delete'), style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/events/${eventId}`);
                    Alert.alert(t('successTitle'), t('eventDeleteSuccess'));
                    navigation.goBack();
                } catch (error) {
                    Alert.alert(t('errorTitle'), t('eventDeleteError'));
                }
            }},
        ]);
    };

    const handleOpenMap = () => {
        const locationQuery = encodeURIComponent(eventDetails.location);
        const url = `https://www.google.com/maps/search/?api=1&query=${locationQuery}`;
        Linking.openURL(url).catch(err => console.error("Harita açılamadı", err));
    };
    
    const handleRemoveAttendee = (attendee) => {
        Alert.alert(t('confirmRemoveAttendeeTitle'), t('confirmRemoveAttendeeMessage', { attendeeName: `${attendee.user.name} ${attendee.user.surname}` }), [
            { text: t('cancel'), style: 'cancel' },
            { text: t('removeFromEvent'), style: 'destructive', onPress: async () => {
                try {
                    await api.delete(`/events/${eventId}/attendees/${attendee.user.id}`);
                    Alert.alert(t('successTitle'), t('attendeeRemoveSuccess'));
                    const response = await api.get(`/events/${eventId}`);
                    setEventDetails(response.data);
                } catch (error) {
                    Alert.alert(t('errorTitle'), t('attendeeRemoveError'));
                }
            }},
        ]);
    };

    if (loading || !eventDetails) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    const { isCurrentUserAttending, canCurrentUserManage, isCurrentUserMemberOfClub, attendees, attendeeCount, formQuestions,pictureURL } = eventDetails;

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
            
                <Image source={{ uri: eventDetails.pictureUrl || 'https://placehold.co/600x400' }} style={styles.eventImage} />
                <View style={styles.content}>
                    <Text style={styles.title}>{eventDetails.description}</Text>
                    <View style={styles.infoRow}>
                        <Ionicons name="business-outline" size={16} color={theme.subtext} />
                        <Text style={styles.infoText}>{eventDetails.club.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={16} color={theme.subtext} />
                        <Text style={styles.infoText}>
                            {new Date(eventDetails.eventDate).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })}
                        </Text>
                    </View>
                    {eventDetails.location && (
                        <View style={styles.infoRow}>
                            <Ionicons name="location-outline" size={16} color={theme.subtext} />
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
                                <Text style={styles.buttonText}>{t('leaveEventButton')}</Text>
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
                        <>
                            {formQuestions && formQuestions.length > 0 && (
                                <TouchableOpacity style={[styles.actionButton, styles.submissionsButton]} onPress={() => navigation.navigate('EventSubmissions', { eventId })}>
                                    <Ionicons name="document-text-outline" size={20} color="white" />
                                    <Text style={styles.buttonText}>{t('viewSubmissions')}</Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => navigation.navigate('EditEvent', { event: eventDetails })}>
                                <Ionicons name="pencil-outline" size={20} color="white" />
                                <Text style={styles.buttonText}>{t('editEventTitle')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDeleteEvent}>
                                <Ionicons name="trash-outline" size={20} color="white" />
                                <Text style={styles.buttonText}>{t('deleteEvent')}</Text>
                            </TouchableOpacity>
                        </>
                    )}
                </View>
                
                <View style={styles.attendeesSection}>
                    <Text style={styles.sectionTitle}>{t('attendeeCount', { count: attendeeCount })}</Text>
                    {canCurrentUserManage && attendees && attendees.map(attendee => (
                        <TouchableOpacity 
                            key={attendee.user.id} 
                            style={styles.attendeeCard}
                            onPress={() => navigation.navigate('MemberDetail', { userId: attendee.user.id, memberName: `${attendee.user.name} ${attendee.user.surname}`, clubId: eventDetails.club.id })}
                            onLongPress={() => handleRemoveAttendee(attendee)}
                        >
                             <View style={styles.attendeeRow}>
                                <Image source={{ uri: attendee.user.profilePictureUrl }} style={styles.attendeeImage} />
                                <View>
                                    <Text style={styles.attendeeName}>{attendee.user.name} {attendee.user.surname}</Text>
                                    <Text style={styles.attendeeDate}>Katılım: {new Date(attendee.joinedAt).toLocaleDateString('tr-TR')}</Text>
                                </View>
                            </View>
                            {attendee.formAnswers && attendee.formAnswers.length > 0 && (
                                <View style={styles.answersContainer}>
                                    <Text style={styles.answersTitle}>{t('formAnswers')}</Text>
                                    {attendee.formAnswers.map((answer, index) => (
                                        <View key={index} style={styles.answerRow}>
                                            <Text style={styles.questionText}>{answer.questionText}:</Text>
                                            <Text style={styles.answerText}>{answer.answerText}</Text>
                                        </View>
                                    ))}
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    eventImage: { width: '100%', height: 250, backgroundColor: theme.border },
    content: { padding: 20 },
    title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, color: theme.text },
    infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
    infoText: { fontSize: 16, color: theme.subtext, marginLeft: 8 },
    actionsContainer: { paddingHorizontal: 20, marginTop: 10, borderBottomWidth: 1, borderBottomColor: theme.border, paddingBottom: 20 },
    actionButton: { flexDirection: 'row', justifyContent: 'center', padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
    mapButton: { backgroundColor: '#34C759' },
    attendButton: { backgroundColor: theme.primary },
    leaveButton: { backgroundColor: '#5856D6' },
    editButton: { backgroundColor: '#FF9500' },
    deleteButton: { backgroundColor: theme.destructive },
    submissionsButton: { backgroundColor: '#5E5CE6' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
    notMemberContainer: { alignItems: 'center', padding: 20, backgroundColor: '#fff3cd', borderRadius: 10 },
    notMemberText: { color: '#856404', textAlign: 'center', marginBottom: 15, fontSize: 16 },
    joinClubButton: { backgroundColor: '#ffc107' },
    attendeesSection: { padding: 20 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: theme.text },
    attendeeCard: { backgroundColor: theme.card, borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1, borderColor: theme.border },
    attendeeRow: { flexDirection: 'row', alignItems: 'center' },
    attendeeImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12, backgroundColor: theme.border },
    attendeeName: { fontSize: 16, fontWeight: 'bold', color: theme.text },
    attendeeDate: { fontSize: 12, color: theme.subtext },
    answersContainer: { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: theme.border },
    answersTitle: { fontWeight: '600', marginBottom: 5, color: theme.text },
    answerRow: { marginBottom: 4 },
    questionText: { fontSize: 14, color: theme.subtext, fontWeight: '500' },
    answerText: { fontSize: 14, color: theme.text },
});

export default EventDetailScreen;
