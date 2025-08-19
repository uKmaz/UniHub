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
    const [groupedData, setGroupedData] = useState([]);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            const fetchData = async () => {
                setLoading(true);
                try {
                    const response = await api.get(`/events/${eventId}/submissions`);
                    const submissions = response.data;

                    // Kullanıcıya göre grupla
                    const userMap = {};
                    submissions.forEach(submission => {
                        submission.userAnswers.forEach(answer => {
                            if (!userMap[answer.userName]) {
                                userMap[answer.userName] = [];
                            }
                            userMap[answer.userName].push({
                                question: submission.questionText,
                                answer: answer.answerText
                            });
                        });
                    });

                    const groupedArray = Object.keys(userMap).map(user => ({
                        userName: user,
                        answers: userMap[user]
                    }));

                    setGroupedData(groupedArray);
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
        let csvString = "Kullanıcı,Soru,Cevap\n";
        groupedData.forEach(userData => {
            userData.answers.forEach(item => {
                const user = `"${userData.userName.replace(/"/g, '""')}"`;
                const question = `"${item.question.replace(/"/g, '""')}"`;
                const answer = `"${item.answer.replace(/"/g, '""')}"`;
                csvString += `${user},${question},${answer}\n`;
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
                <TouchableOpacity onPress={handleDownload} style={{ marginRight: 15 }} disabled={groupedData.length === 0}>
                    <Ionicons name="download-outline" size={24} color={groupedData.length > 0 ? "#007AFF" : "gray"} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, groupedData]);

    if (loading) {
        return <View style={styles.center}><ActivityIndicator size="large" /></View>;
    }

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={groupedData}
                keyExtractor={(item) => item.userName}
                renderItem={({ item }) => (
                    <View style={styles.section}>
                        <Text style={styles.userName}>{item.userName}</Text>
                        {item.answers.map((ans, idx) => (
                            <View key={idx} style={styles.answerRow}>
                                <Text style={styles.question}>{ans.question}:</Text>
                                <Text style={styles.answer}>{ans.answer}</Text>
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
    userName: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, color: '#007AFF' },
    answerRow: { flexDirection: 'row', marginBottom: 5 },
    question: { fontWeight: '600', marginRight: 4, flex: 0.5 },
    answer: { flex: 1 },
    emptyText: { textAlign: 'center', color: 'gray', marginTop: 50 },
});

export default EventSubmissionsScreen;
