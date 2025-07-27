import React from 'react';
import { View, Text, StyleSheet, Button, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const EventDetailScreen = ({ route }) => {
    const { t } = useTranslation();
    const { eventId } = route.params;

    const handleAttend = async () => {
        try {
            await api.post(`/events/${eventId}/attend`);
            Alert.alert(t('successTitle'), t('eventAttendSuccess'));
        } catch (error) {
            Alert.alert(t('errorTitle'), t('eventAttendError'));
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>{t('eventDetailTitle')}</Text>
            {/* Buraya etkinliğin tüm detayları gelecek */}
            <Button title={t('attendEventButton')} onPress={handleAttend} />
        </View>
    );
};
const styles = StyleSheet.create({ container: { flex: 1, justifyContent: 'center', alignItems: 'center' }, title: { fontSize: 22, fontWeight: 'bold' } });
export default EventDetailScreen;