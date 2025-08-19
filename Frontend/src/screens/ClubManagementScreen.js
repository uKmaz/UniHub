import React, { useState, useCallback, useLayoutEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    FlatList, 
    ActivityIndicator, 
    TouchableOpacity, 
    Alert, 
    Image,
    ScrollView
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';

const ClubManagementScreen = ({ route, navigation }) => {
    const { clubId, clubName } = route.params;
    const { t } = useTranslation();
    const [pendingMembers, setPendingMembers] = useState([]);
    const [allMembers, setAllMembers] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchData = useCallback(() => {
        const fetchManagementData = async () => {
            setLoading(true);
            try {
                const [pendingRes, clubRes] = await Promise.all([
                    api.get(`/clubs/${clubId}/pending-members`),
                    api.get(`/clubs/${clubId}`)
                ]);
                setPendingMembers(pendingRes.data);
                const approvedMembers = clubRes.data.members.filter(m => m.status === 'APPROVED');
                setAllMembers(approvedMembers);
            } catch (error) {
                console.error("Yönetim verileri çekilemedi:", error);
                Alert.alert(t('errorTitle'), "Veriler yüklenirken bir sorun oluştu.");
            } finally {
                setLoading(false);
            }
        };
        fetchManagementData();
    }, [clubId, t]);

    useFocusEffect(fetchData);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={() => navigation.navigate('ClubLogs', { clubId })} style={{ marginRight: 15 }}>
                    <Ionicons name="reader-outline" size={24} color="#007AFF" />
                </TouchableOpacity>
            ),
        });
    }, [navigation, clubId]);

    const handleRequest = async (userId, approve) => {
        try {
            const endpoint = `/clubs/${clubId}/requests/${userId}/${approve ? 'approve' : 'reject'}`;
            await api.post(endpoint);
            fetchData();
        } catch (error) {
            console.error("İstek işlenirken hata:", error);
            Alert.alert(t('errorTitle'), "İşlem gerçekleştirilemedi.");
        }
    };
    
    const handleRemoveMember = (member) => {
        Alert.alert(
            t('confirmRemoveTitle'),
            t('confirmRemoveMessage', { memberName: member.name }),
            [
                { text: t('cancel'), style: 'cancel' },
                { text: t('removeFromClub'), style: 'destructive', onPress: async () => {
                    try {
                        await api.delete(`/clubs/${clubId}/members/${member.userId}`);
                        fetchData();
                    } catch (error) {
                        Alert.alert(t('errorTitle'), "Üye atılamadı.");
                    }
                }}
            ]
        );
    };

    const renderMemberItem = ({ item, section }) => (
        <TouchableOpacity 
            style={styles.memberRow}
            onPress={() => navigation.navigate('MemberDetail', { 
                userId: item.userId, 
                memberName: item.name,
                clubId: clubId
            })}
        >
            <Image source={{ uri: item.profilePictureUrl || 'https://placehold.co/100' }} style={styles.memberImage} />
            <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{item.name}</Text>
                {section === 'all' && <Text style={styles.memberRole}>{item.role}</Text>}
            </View>
            
            {section === 'pending' && (
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleRequest(item.userId, true)} style={[styles.iconButton, styles.approveButton]}>
                        <Ionicons name="checkmark-circle" size={28} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleRequest(item.userId, false)} style={[styles.iconButton, styles.rejectButton]}>
                        <Ionicons name="close-circle" size={28} color="white" />
                    </TouchableOpacity>
                </View>
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <Text style={styles.title}>{clubName}</Text>
                
                <View style={styles.section}>
                    <TouchableOpacity 
                        style={styles.managementButton} 
                        onPress={() => navigation.navigate('CreatePost', { clubId })}
                    >
                        <Ionicons name="share-social-outline" size={22} color="#34C759" />
                        <Text style={styles.managementButtonText}>{t('sharePost')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.managementButton} 
                        onPress={() => navigation.navigate('CreateEvent', { clubId })}
                    >
                        <Ionicons name="calendar-outline" size={22} color="#FF9500" />
                        <Text style={styles.managementButtonText}>{t('createEvent')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={styles.managementButton} 
                        onPress={() => navigation.navigate('EditClub', { clubId })}
                    >
                        <Ionicons name="pencil-outline" size={22} color="#007AFF" />
                        <Text style={styles.managementButtonText}>{t('editClub')}</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('pendingRequests')}</Text>
                    <FlatList
                        data={pendingMembers}
                        renderItem={(props) => renderMemberItem({ ...props, section: 'pending' })}
                        keyExtractor={(item) => `pending-${item.userId}`}
                        ListEmptyComponent={<Text style={styles.emptyText}>{t('noPendingRequests')}</Text>}
                        scrollEnabled={false}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('allMembers')}</Text>
                    <FlatList
                        data={allMembers}
                        renderItem={(props) => renderMemberItem({ ...props, section: 'all' })}
                        keyExtractor={(item) => `member-${item.userId}`}
                        scrollEnabled={false}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginVertical: 20 },
    section: { backgroundColor: 'white', marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
    memberRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
    memberImage: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
    memberInfo: { flex: 1 },
    memberName: { fontSize: 16, fontWeight: '500' },
    memberRole: { fontSize: 12, color: 'gray' },
    actions: { flexDirection: 'row' },
    iconButton: { padding: 8, borderRadius: 20, marginLeft: 8 },
    approveButton: { backgroundColor: '#4CAF50' },
    rejectButton: { backgroundColor: '#F44336' },
    emptyText: { textAlign: 'center', color: 'gray', padding: 10 },
    managementButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingVertical: 12, paddingHorizontal: 15, borderRadius: 10, borderWidth: 1, borderColor: '#e0e0e0', marginBottom: 10 },
    managementButtonText: { marginLeft: 15, fontSize: 16, color: '#333', fontWeight: '500' },
});

export default ClubManagementScreen;
