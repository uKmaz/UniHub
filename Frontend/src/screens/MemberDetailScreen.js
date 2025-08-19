import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ActivityIndicator, ScrollView, Image, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/ApiService';

const MemberDetailScreen = ({ route, navigation }) => {
    const { userId, clubId } = route.params;
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

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
const handleTransferOwnership = () => {
        Alert.alert(
            t('confirmTransferOwnershipTitle'),
            t('confirmTransferOwnershipMessage', { memberName: userProfile.name }),
            [
                { text: t('cancel'), style: 'cancel' },
                {
                    text: t('confirm'),
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/clubs/${clubId}/members/${userId}/transfer-ownership`);
                            Alert.alert(
                                t('successTitle'), 
                                t('ownershipTransferSuccess', { memberName: userProfile.name })
                            );
                            navigation.goBack();
                        } catch (error) {
                            Alert.alert(t('errorTitle'), t('ownershipTransferError'));
                        }
                    },
                },
            ]
        );
    };
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
                        navigation.goBack();
                    } catch (error) {
                        Alert.alert(t('errorTitle'), "Üye atılamadı.");
                    }
                }}
            ]
        );
    };

    if (loading || !userProfile) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
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
                        <Text style={styles.userInfoText}>{t('studentIdLabel')}{userProfile.studentID}</Text>
                        
                        <View style={styles.schoolInfoContainer}>
                            <Ionicons name="school-outline" size={16} color={theme.subtext} />
                            <Text style={styles.schoolInfoText} numberOfLines={2}>
                                {userProfile.department}, {userProfile.faculty}
                            </Text>
                        </View>
                    </View>
                </View>
                
                {membership && membership.userRoleInClub !== 'OWNER' && (
                    <View style={styles.managementSection}>
                        <TouchableOpacity style={styles.actionButton} onPress={handlePromote}>
                            <Text style={styles.actionButtonText}>
                                {membership.userRoleInClub === 'MANAGER' ? t('demoteToMember') : t('promoteToManager')}
                            </Text>
                        </TouchableOpacity>
                        {membership.userRoleInClub === 'MANAGER' && (
                                    <TouchableOpacity style={[styles.actionButton, styles.ownerButton]} onPress={handleTransferOwnership}>
                                        <Text style={styles.actionButtonText}>{t('transferButton')}</Text>
                                    </TouchableOpacity>
                                )}
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

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    idCard: { flexDirection: 'row', backgroundColor: theme.card, padding: 20, margin: 16, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, alignItems: 'center' },
    profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.primary },
    userInfo: { flex: 1, marginLeft: 20 },
    userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: theme.text },
    userInfoText: { fontSize: 14, color: theme.subtext, marginBottom: 4 },
    schoolInfoContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, flexShrink: 1 },
    schoolInfoText: { fontSize: 13, color: theme.subtext, marginLeft: 6, flexShrink: 1 },
    managementSection: { margin: 16 },
    actionButton: { backgroundColor: theme.primary, padding: 15, borderRadius: 8, alignItems: 'center', marginBottom: 10 },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    removeButton: { backgroundColor: theme.destructive }
});

export default MemberDetailScreen;