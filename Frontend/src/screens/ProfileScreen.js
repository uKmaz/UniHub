import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    Image, 
    TouchableOpacity, 
    ActivityIndicator, 
    ScrollView,
    Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTranslation } from 'react-i18next';
import api from '../services/ApiService';
import { auth } from '../services/FirebaseConfig';
import { useTheme } from '../context/ThemeContext'; // -> TEMA İÇİN IMPORT

// EventListItem bileşeni artık stilleri bir prop olarak alacak
const EventListItem = ({ event, onPress, styles }) => (
    <TouchableOpacity style={styles.eventListItem} onPress={onPress}>
        <Image 
            source={{ uri: event.clubProfilePictureUrl || 'https://placehold.co/100' }} 
            style={styles.eventClubImage}
        />
        <View style={styles.eventInfo}>
            <Text style={styles.eventDescription} numberOfLines={1}>{event.description}</Text>
            <Text style={styles.eventClubName}>{event.clubName}</Text>
        </View>
        <Text style={styles.eventDate}>
            {new Date(event.eventDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
        </Text>
    </TouchableOpacity>
);

const ProfileScreen = ({ navigation }) => {
    const { t } = useTranslation();
    const { theme } = useTheme(); // -> Temayı al
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchUserProfile = useCallback(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const response = await api.get('/users/me');
                setUserProfile(response.data);
            } catch (error) {
                console.error("Profil verisi çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    useFocusEffect(fetchUserProfile);

    const handlePhotoOptions = () => {
        if (!userProfile?.profilePictureUrl || userProfile.profilePictureUrl.includes('default_user_avatar.png')) {
            pickImage();
            return;
        }
        Alert.alert(
            t('photoOptionsTitle'), t('photoOptionsMessage'),
            [
                { text: t('changePhoto'), onPress: () => pickImage() },
                { text: t('deletePhoto'), onPress: () => handleDeleteImage(), style: 'destructive' },
                { text: t('cancel'), style: 'cancel' }
            ]
        );
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert(t('permissionRequired'), t('galleryPermissionInfo'));
            return;
        }
        try {
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: 'Images',
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
            });
            if (!result.canceled && result.assets && result.assets.length > 0) {
                await uploadImage(result.assets[0].uri);
            }
        } catch(error) {
            console.error("Galeri açılırken hata:", error);
            Alert.alert(t('errorTitle'), "Galeri açılırken bir sorun oluştu.");
        }
    };

    const uploadImage = async (uri) => {
        setLoading(true);
        try {
            const response = await fetch(uri);
            const blob = await response.blob();
            const storage = getStorage();
            const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
            await uploadBytes(storageRef, blob);
            const downloadURL = await getDownloadURL(storageRef);
            const updatedProfileResponse = await api.put('/users/me', { profilePictureUrl: downloadURL });
            setUserProfile(updatedProfileResponse.data);
            Alert.alert(t('successTitle'), t('photoUpdateSuccess'));
        } catch (error) {
            Alert.alert(t('errorTitle'), t('photoUpdateError'));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteImage = async () => {
        setLoading(true);
        try {
            const storage = getStorage();
            const storageRef = ref(storage, `profile_pictures/${auth.currentUser.uid}`);
            await deleteObject(storageRef);
            const updatedProfileResponse = await api.put('/users/me', { profilePictureUrl: null });
            setUserProfile(updatedProfileResponse.data);
            Alert.alert(t('successTitle'), t('photoDeleteSuccess'));
        } catch (error) {
            if (error.code === 'storage/object-not-found') {
                try {
                    const updatedProfileResponse = await api.put('/users/me', { profilePictureUrl: null });
                    setUserProfile(updatedProfileResponse.data);
                } catch (apiError) {
                     Alert.alert(t('errorTitle'), t('photoDeleteError'));
                }
            } else {
                Alert.alert(t('errorTitle'), t('photoDeleteError'));
            }
        } finally {
            setLoading(false);
        }
    };

    const styles = getStyles(theme); // -> Stilleri temaya göre oluştur

    if (loading || !userProfile) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.idCard}>
                    <TouchableOpacity onPress={handlePhotoOptions}>
                        <Image 
                            source={{ uri: userProfile.profilePictureUrl || `https://placehold.co/150x150/e0e0e0/777?text=${t('uploadPhoto')}` }} 
                            style={styles.profileImage} 
                        />
                        <View style={styles.cameraIcon}>
                            <Ionicons name="camera" size={20} color="white" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.userInfo}>
                        <Text style={styles.userName}>{userProfile.name} {userProfile.surname}</Text>
                        <Text style={styles.userInfoText}>{userProfile.email}</Text>
                        <Text style={styles.userInfoText}>{t('studentIdLabel')}{userProfile.studentID}</Text>
                    </View>
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('myClubs')}</Text>
                    {userProfile.memberships && userProfile.memberships.length > 0 ? (
                        userProfile.memberships.map(membership => (
                            <TouchableOpacity key={membership.clubId} style={styles.listItem} onPress={() => navigation.navigate('ClubDetail', { clubId: membership.clubId, clubName: membership.clubName })}>
                                <Text style={styles.listItemText}>{membership.clubShortName}</Text>
                                <Text style={styles.roleText}>{membership.userRoleInClub}</Text>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={styles.emptyText}>{t('noClubsJoined')}</Text>
                    )}
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('upcomingEvents')}</Text>
                    {userProfile.upcomingAttendedEvents && userProfile.upcomingAttendedEvents.length > 0 ? (
                        userProfile.upcomingAttendedEvents.map(event => (
                            <EventListItem 
                                key={event.id} 
                                event={event} 
                                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                                styles={styles} // -> Stilleri EventListItem'e gönder
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>{t('noUpcomingEventsProfile')}</Text>
                    )}
                </View>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('pastEvents')}</Text>
                     {userProfile.pastAttendedEvents && userProfile.pastAttendedEvents.length > 0 ? (
                        userProfile.pastAttendedEvents.map(event => (
                            <EventListItem 
                                key={event.id} 
                                event={event} 
                                onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                                styles={styles} // -> Stilleri EventListItem'e gönder
                            />
                        ))
                    ) : (
                        <Text style={styles.emptyText}>{t('noPastEventsProfile')}</Text>
                    )}
                </View>
                 <TouchableOpacity 
                    style={styles.editProfileButton}
                    onPress={() => navigation.navigate('UpdateProfile')}
                >
                    <Ionicons name="pencil" size={20} color="white" />
                    <Text style={styles.editProfileButtonText}>{t('editProfile')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

// Stilleri bir fonksiyon haline getiriyoruz
const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    idCard: { flexDirection: 'row', backgroundColor: theme.card, padding: 20, margin: 16, borderRadius: 12, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, alignItems: 'center' },
    profileImage: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: theme.primary },
    cameraIcon: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.primary, padding: 6, borderRadius: 15 },
    userInfo: { flex: 1, marginLeft: 20 },
    userName: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, color: theme.text },
    userInfoText: { fontSize: 14, color: theme.subtext, marginBottom: 4 },
    section: { backgroundColor: theme.card, marginHorizontal: 16, marginBottom: 16, borderRadius: 12, padding: 16 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: theme.text },
    listItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.border },
    listItemText: { fontSize: 16, color: theme.text },
    roleText: { fontSize: 14, color: theme.subtext, fontStyle: 'italic' },
    emptyText: { fontSize: 14, color: theme.subtext, textAlign: 'center', paddingVertical: 20 },
    editProfileButton: { flexDirection: 'row', backgroundColor: '#5856D6', margin: 16, paddingVertical: 15, borderRadius: 12, justifyContent: 'center', alignItems: 'center', elevation: 3 },
    editProfileButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16, marginLeft: 8 },
    eventListItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: theme.border },
    eventClubImage: { width: 40, height: 40, borderRadius: 8, marginRight: 12, backgroundColor: theme.border },
    eventInfo: { flex: 1 },
    eventDescription: { fontSize: 16, fontWeight: '500', color: theme.text },
    eventClubName: { fontSize: 12, color: theme.subtext },
    eventDate: { fontSize: 14, fontWeight: '600', color: theme.primary },
});

export default ProfileScreen;
