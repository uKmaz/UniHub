import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';

const MemberDetailScreen = ({ route, navigation }) => {
    const { userId, clubId } = route.params;
    const { t } = useTranslation();
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get(`/users/${userId}`);
                setUserProfile(response.data);
            } catch (error) {
                console.error("Üye profili çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [userId]);

    useFocusEffect(fetchUserProfile);
    
    const handlePromote = () => {
        const member = userProfile.memberships.find(m => m.clubId === clubId);
        if (!member) return;

        const isManager = member.userRoleInClub === 'MANAGER';
        const title = isManager ? t('demoteToMemberConfirmTitle') : t('promoteToManagerConfirmTitle');
        const message = isManager ? t('demoteToMemberConfirmMessage', { memberName: userProfile.name }) : t('promoteToManagerConfirmMessage', { memberName: userProfile.name });
        const endpoint = isManager ? `/demote` : `/promote`;
        const successMessage = isManager ? t('demoteSuccess') : t('promoteSuccess');

        Alert.alert(title, message, [
            { text: t('cancel'), style: 'cancel' },
            { text: t('confirm'), onPress: async () => {
                try {
                    await api.post(`/clubs/${clubId}/members/${userId}${endpoint}`);
                    Alert.alert(t('successTitle'), successMessage);
                    fetchUserProfile();
                } catch (error) {
                    Alert.alert(t('errorTitle'), t('actionError'));
                }
            }}
        ]);
    };

    // YENİ FONKSİYON: Üyeyi kulüpten atar
    const handleRemoveMember = () => {
        Alert.alert(
            t('confirmRemoveTitle'),
            t('confirmRemoveMessage', { memberName: userProfile.name }),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('removeFromClub'), style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/clubs/${clubId}/members/${userId}`);
                        Alert.alert(t('successTitle'), "Üye başarıyla atıldı.");
                        // Başarılı silme sonrası bir önceki ekrana dön
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert(t('errorTitle'), "Üye atılamadı.");
                    }
                }}
            ]
        );
    };

    if (loading || !userProfile) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    const membership = userProfile.memberships.find(m => m.clubId === clubId);

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.idCard}>
                    <Image 
                        source={{ uri: userProfile.profilePictureUrl || 'https://placehold.co/150' }} 
                        style={styles.profileImage} 
                    />
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userProfile.name} {userProfile.surname}</Text>
                        <Text style={styles.userInfoText}>{userProfile.email}</Text>
                        <Text style={styles.userInfoText}>Öğrenci No: {userProfile.studentID}</Text>
                    </View>
                </View>
                
                {membership && membership.userRoleInClub !== 'OWNER' && (
                    <View style={styles.managementSection}>
                        <TouchableOpacity style={styles.actionButton} onPress={handlePromote}>
                            <Text style={styles.actionButtonText}>
                                {membership.userRoleInClub === 'MANAGER' ? t('demoteToMember') : t('promoteToManager')}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.actionButton, styles.removeButton]} onPress={handleRemoveMember}>
                            <Text style={styles.actionButtonText}>
                                {t('removeFromClub')}
                            </Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    idCard: { flexDirection: 'row', backgroundColor: 'white', padding: 20, margin: 16, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, alignItems: 'center' },
    profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: '#007AFF' },
    userInfo: { flex: 1, marginLeft: 20 },
    userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    userInfoText: { fontSize: 14, color: '#666', marginBottom: 4 },
    managementSection: { margin: 16 },
    actionButton: { backgroundColor: '#007AFF', padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    removeButton: { backgroundColor: '#F44336' } // Kırmızı renk
});

export default MemberDetailScreen;