import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, FlatList, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useFocusEffect } from '@react-navigation/native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import api from '../services/ApiService';

const SearchScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);

    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [discoveryData, setDiscoveryData] = useState({ topByMembers: [], topByEvents: [], randomClubs: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('members');
    const [filters, setFilters] = useState({});

    useEffect(() => {
        if (route.params?.appliedFilters) {
            setFilters(route.params.appliedFilters);
        }
    }, [route.params?.appliedFilters]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const params = new URLSearchParams(Object.entries(filters).filter(([_, v]) => v != null)).toString();
                const response = await api.get(`/clubs/discover?${params}`);
                setDiscoveryData(response.data);
            } catch (error) {
                console.error("Keşfet verisi çekilemedi:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [filters]);

    useEffect(() => {
        const handler = setTimeout(async () => {
            if (searchTerm.trim().length > 2) {
                const response = await api.get(`/clubs/search?term=${searchTerm}`);
                setSearchResults(response.data);
            } else {
                setSearchResults([]);
            }
        }, 300);

        return () => clearTimeout(handler);
    }, [searchTerm]);

    const renderTopClubItem = ({ item }) => (
        <TouchableOpacity style={styles.topClubItem} onPress={() => navigation.navigate('ClubDetail', { clubId: item.id, clubName: item.name })}>
            <Image source={{ uri: item.profilePictureUrl }} style={styles.topClubImage} />
            <Text style={styles.topClubName} numberOfLines={2}>{item.name}</Text>
        </TouchableOpacity>
    );

    const renderRandomClubItem = ({ item }) => (
        <TouchableOpacity style={styles.randomClubItem} onPress={() => navigation.navigate('ClubDetail', { clubId: item.id, clubName: item.name })}>
            <Image source={{ uri: item.profilePictureUrl }} style={styles.randomClubImage} />
            <View style={styles.randomClubOverlay} />
            <Text style={styles.randomClubName}>{item.name}</Text>
            <Text style={styles.randomClubShortName}>{item.shortName}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={theme.subtext} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder={t('searchPlaceholder')}
                    placeholderTextColor={theme.subtext}
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                />
                <TouchableOpacity onPress={() => navigation.navigate('Filter', { 
                    currentFilters: filters,
                    onApplyFilters: setFilters
                })}>
                    <Ionicons name="options-outline" size={24} color={theme.primary} />
                </TouchableOpacity>
            </View>

            {searchTerm.trim().length > 0 ? (
                <FlatList 
                    data={searchResults} 
                    renderItem={renderTopClubItem} 
                    keyExtractor={item => item.id.toString()}
                    contentContainerStyle={{ alignItems: 'center' }}
                />
            ) : (
                <ScrollView>
                    <View style={styles.tabContainer}>
                        <TouchableOpacity onPress={() => setActiveTab('members')} style={[styles.tab, activeTab === 'members' && styles.activeTab]}>
                            <Text style={[styles.tabText, activeTab === 'members' && styles.activeTabText]}>{t('topByMembers')}</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setActiveTab('events')} style={[styles.tab, activeTab === 'events' && styles.activeTab]}>
                            <Text style={[styles.tabText, activeTab === 'events' && styles.activeTabText]}>{t('topByEvents')}</Text>
                        </TouchableOpacity>
                    </View>
                    
                    <FlatList
                        horizontal
                        data={activeTab === 'members' ? discoveryData.topByMembers : discoveryData.topByEvents}
                        renderItem={renderTopClubItem}
                        keyExtractor={item => item.id.toString()}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.horizontalList}
                    />

                    <Text style={styles.sectionTitle}>{t('discoverNewClubs')}</Text>
                    {discoveryData.randomClubs.map(item => <View key={item.id}>{renderRandomClubItem({ item })}</View>)}
                </ScrollView>
            )}

            {/* --- YENİ EKLENEN BUTON --- */}
            <TouchableOpacity 
                style={styles.createClubButton} 
                onPress={() => navigation.navigate('CreateClub')}
            >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.createClubButtonText}>{t('createNewClub')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.card, borderRadius: 10, margin: 16, paddingHorizontal: 10, borderWidth: 1, borderColor: theme.border },
    searchIcon: { marginRight: 10 },
    searchInput: { flex: 1, height: 44, color: theme.text, fontSize: 16 },
    tabContainer: { flexDirection: 'row', justifyContent: 'center', marginVertical: 10 },
    tab: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, marginHorizontal: 5, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border },
    activeTab: { backgroundColor: theme.primary, borderColor: theme.primary },
    tabText: { color: theme.subtext, fontWeight: '600' },
    activeTabText: { color: 'white' },
    horizontalList: { paddingHorizontal: 16, paddingBottom: 10 },
    topClubItem: { alignItems: 'center', marginRight: 15, width: 90 },
    topClubImage: { width: 70, height: 70, borderRadius: 35, marginBottom: 8, backgroundColor: theme.border },
    topClubName: { color: theme.text, fontSize: 12, textAlign: 'center' },
    sectionTitle: { fontSize: 20, fontWeight: 'bold', color: theme.text, marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
    randomClubItem: { backgroundColor: theme.card, borderRadius: 12, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    randomClubImage: { width: '100%', height: 150 },
    randomClubOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
    randomClubName: { position: 'absolute', bottom: 30, left: 15, color: 'white', fontSize: 22, fontWeight: 'bold', textShadowColor: 'rgba(0, 0, 0, 0.75)', textShadowOffset: {width: -1, height: 1}, textShadowRadius: 10 },
    randomClubShortName: { position: 'absolute', bottom: 10, left: 15, color: 'white', fontSize: 14, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: 6, borderRadius: 4 },
    // --- YENİ STİLLER ---
    createClubButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        flexDirection: 'row',
        backgroundColor: theme.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    createClubButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    }
});

export default SearchScreen;
