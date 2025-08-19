import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import Ionicons from '@expo/vector-icons/Ionicons';

const ClubLogScreen = ({ route }) => {
    const { clubId } = route.params;
    const { t } = useTranslation();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState(null);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const [logsRes, profileRes] = await Promise.all([
                        api.get(`/clubs/${clubId}/logs`),
                        api.get('/users/me')
                    ]);
                    setLogs(logsRes.data);
                    const membership = profileRes.data.memberships?.find(m => m.clubId === clubId);
                    setCurrentUserRole(membership?.userRoleInClub);
                } catch (error) {
                    console.error("Veriler çekilemedi:", error);
                } finally {
                    setLoading(false);
                }
            };
            fetchData();
        }, [clubId])
    );

    const handleDeleteLog = async (logId) => {
        try {
            await api.delete(`/clubs/${clubId}/logs/${logId}`);
            setLogs(prevLogs => prevLogs.filter(log => log.id !== logId));
        } catch (error) {
            console.error("Log silinemedi:", error);
        }
    };
    
    const renderRightActions = (progress, dragX, logId) => {
        const trans = dragX.interpolate({
            inputRange: [-80, 0], outputRange: [0, 80], extrapolate: 'clamp',
        });
        return (
            <TouchableOpacity onPress={() => handleDeleteLog(logId)} style={styles.deleteButton}>
                <Animated.View style={{ transform: [{ translateX: trans }] }}>
                    <Ionicons name="trash-outline" size={24} color="white" />
                </Animated.View>
            </TouchableOpacity>
        );
    };

    const renderLogItem = ({ item }) => {
        if (currentUserRole === 'OWNER') {
            return (
                <Swipeable renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item.id)}>
                    <View style={styles.logItem}>
                        <Text style={styles.logAction}>{item.action}</Text>
                        <Text style={styles.logMeta}>{item.actorName} - {new Date(item.timestamp).toLocaleString('tr-TR')}</Text>
                    </View>
                </Swipeable>
            );
        }
        return (
            <View style={styles.logItem}>
                <Text style={styles.logAction}>{item.action}</Text>
                <Text style={styles.logMeta}>{item.actorName} - {new Date(item.timestamp).toLocaleString('tr-TR')}</Text>
            </View>
        );
    };

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <FlatList
                    data={logs}
                    renderItem={renderLogItem}
                    keyExtractor={(item) => item.id.toString()}
                    ListEmptyComponent={<Text style={styles.emptyText}>{t('noLogsFound')}</Text>}
                />
            </SafeAreaView>
        </GestureHandlerRootView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    logItem: { backgroundColor: 'white', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
    logAction: { fontSize: 16, fontWeight: '500', marginBottom: 4 },
    logMeta: { fontSize: 12, color: 'gray' },
    emptyText: { textAlign: 'center', color: 'gray', marginTop: 50 },
    deleteButton: { backgroundColor: '#FF3B30', justifyContent: 'center', alignItems: 'flex-end', width: 80, paddingRight: 20 },
});

export default ClubLogScreen;