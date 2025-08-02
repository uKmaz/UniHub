import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';

const SearchScreen = ({ navigation }) => {
    const { t } = useTranslation();
    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.text}>{t('searchScreenTitle')}</Text>
            <TouchableOpacity style={styles.createClubButton} onPress={() => navigation.navigate('CreateClub')}>
                <Ionicons name="add-circle" size={24} color="white" />
                <Text style={styles.createClubButtonText}>{t('createNewClub')}</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
};
const styles = StyleSheet.create({
    container: { 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center' 
    },
    text: { 
        fontSize: 20 
    },
    createClubButton: {
        position: 'absolute',
        bottom: 30,
        right: 20,
        flexDirection: 'row',
        backgroundColor: '#007AFF',
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