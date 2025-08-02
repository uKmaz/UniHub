import React, { useState, useCallback } from 'react';
import { 
    View, 
    Text, 
    TextInput, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Alert, 
    ActivityIndicator, 
    Switch,
    FlatList // FlatList'i kullanacağız
} from 'react-native';
import { useTranslation } from 'react-i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import api from '../services/ApiService';

const EventFormScreen = ({ route, navigation }) => {
    const { eventId, questions } = route.params;
    const { t } = useTranslation();
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState(false);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const payload = {
                answers: Object.keys(answers).map(questionId => ({
                    questionId: Number(questionId),
                    answerText: String(answers[questionId])
                }))
            };
            await api.post(`/events/${eventId}/submit-form`, payload);
            Alert.alert(t('successTitle'), t('eventAttendSuccess'));
            navigation.goBack();
        } catch (error) {
            console.error("Form gönderme hatası:", error);
            Alert.alert(t('errorTitle'), t('eventAttendError'));
        } finally {
            setLoading(false);
        }
    };

    // Her bir soru tipini render eden fonksiyon
    const renderQuestionItem = useCallback(({ item: question }) => {
        switch (question.questionType) {
            case 'BOOLEAN':
                return (
                    <View style={styles.questionRow}>
                        <Text style={styles.questionText}>{question.questionText}</Text>
                        <Switch
                            value={!!answers[question.id]}
                            onValueChange={value => handleAnswerChange(question.id, value)}
                        />
                    </View>
                );
            
            case 'PHONE':
                return (
                    <View style={styles.questionBlock}>
                        <Text style={styles.questionText}>{question.questionText}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="call-outline" size={20} color="gray" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                onChangeText={text => handleAnswerChange(question.id, text)}
                                keyboardType="phone-pad"
                                placeholder="555 123 4567"
                            />
                        </View>
                    </View>
                );

            case 'EMAIL':
                return (
                    <View style={styles.questionBlock}>
                        <Text style={styles.questionText}>{question.questionText}</Text>
                        <View style={styles.inputContainer}>
                            <Ionicons name="mail-outline" size={20} color="gray" style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                onChangeText={text => handleAnswerChange(question.id, text)}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="ornek@mail.com"
                            />
                        </View>
                    </View>
                );
            
            default: // TEXT
                return (
                    <View style={styles.questionBlock}>
                        <Text style={styles.questionText}>{question.questionText}</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={text => handleAnswerChange(question.id, text)}
                            placeholder="Cevabınız..."
                        />
                    </View>
                );
        }
    }, [answers]); // answers değiştikçe bu fonksiyonun güncel kalmasını sağla

    return (
        <SafeAreaView style={styles.container}>
            <FlatList
                data={questions}
                renderItem={renderQuestionItem}
                keyExtractor={(item) => item.id.toString()}
                contentContainerStyle={styles.formContainer}
                ListFooterComponent={
                    <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
                        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Gönder</Text>}
                    </TouchableOpacity>
                }
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f5f5f5' },
    formContainer: { padding: 20 },
    questionBlock: { backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
    questionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: 16, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#e0e0e0' },
    questionText: { fontSize: 16, fontWeight: '500', marginBottom: 10, flex: 1, marginRight: 10 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', height: 50, borderColor: '#ddd', borderWidth: 1, borderRadius: 8, backgroundColor: '#fff' },
    inputIcon: { paddingHorizontal: 10 },
    input: { flex: 1, height: '100%', paddingHorizontal: 10, fontSize: 16 },
    button: { backgroundColor: '#007AFF', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});

export default EventFormScreen;