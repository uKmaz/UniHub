import React, { useState, useCallback, useLayoutEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';

const EventSubmissionsScreen = ({ route, navigation }) => {
    const { eventId } = route.params;
    const { t } = useTranslation();
    const [submissions, setSubmissions] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- NİHAİ DÜZELTME: useFocusEffect'in doğru kullanımı ---
    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/events/${eventId}/submissions`);
                    setSubmissions(response.data);
                } catch (error) {
                    console.error("Cevaplar çekilemedi:", error);
                } finally {
                    setLoading(false);
                }
            };

            fetchData();
        }, [eventId])
    );

    const handleDownload = async () => {
        let csvString = "Soru,Kullanıcı,Cevap\n";
        submissions.forEach(submission => {
            submission.userAnswers.forEach(answer => {
                const question = `"${submission.questionText.replace(/"/g, '""')}"`;
                const user = `"${answer.userName.replace(/"/g, '""')}"`;
                const answerText = `"${answer.answerText.replace(/"/g, '""')}"`;
                csvString += `${question},${user},${answerText}\n`;
            });
        });

        const fileName = `event-${eventId}-submissions.csv`;
        const fileUri = FileSystem.cacheDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });
        
        if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(fileUri);
        }
    };

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <TouchableOpacity onPress={handleDownload} style={{ marginRight: 15 }} disabled={submissions.length === 0}>
                    <Ionicons name="download-outline" size={24} color={submissions.length > 0 ? "#007AFF" : "gray"} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, submissions]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={submissions}
                keyExtractor={(item) => item.questionText}
                renderItem={({ item }) => (
                    <View style={styles.section}>
                        <Text style={styles.questionTitle}>{item.questionText}</Text>
                        {item.userAnswers.map((answer, index) => (
                            <View key={index} style={styles.answerRow}>
                                <Text style={styles.userName}>{answer.userName}:</Text>
                                <Text style={styles.answerText}>{answer.answerText}</Text>
                            </View>
                        ))}
                    </View>
                )}
                ListEmptyComponent={<Text style={styles.emptyText}>{t('noSubmissions')}</Text>}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f0f2f5' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    section: { backgroundColor: 'white', margin: 16, borderRadius: 12, padding: 16 },
    questionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingBottom: 8 },
    answerRow: { flexDirection: 'row', marginBottom: 5 },
    userName: { fontWeight: '600', marginRight: 8 },
    answerText: { flex: 1 },
    emptyText: { textAlign: 'center', color: 'gray', marginTop: 50 },
});

export default EventSubmissionsScreen;