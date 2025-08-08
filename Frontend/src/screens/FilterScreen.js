import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../context/ThemeContext';
import { universityData } from '../data/universityData';

const FilterScreen = ({ navigation, route }) => {
    const { t } = useTranslation();
    const { theme } = useTheme();
    const styles = getStyles(theme);
    const { currentFilters, onApplyFilters } = route.params;

    const [selection, setSelection] = useState({
        university: currentFilters.university || null,
        faculty: currentFilters.faculty || null,
        department: currentFilters.department || null,
    });

    const [availableFaculties, setAvailableFaculties] = useState([]);
    const [availableDepartments, setAvailableDepartments] = useState([]);

    // Üniversite seçimi değiştiğinde fakülte listesini güncelle
    useEffect(() => {
        if (selection.university) {
            const university = universityData.find(u => u.name === selection.university);
            setAvailableFaculties(university?.faculties || []);
        } else {
            // "Tümü" seçiliyse, tüm üniversitelerdeki benzersiz fakülteleri topla
            const allFaculties = universityData.flatMap(u => u.faculties.map(f => f.name));
            const uniqueFaculties = [...new Set(allFaculties)].map(name => ({ name }));
            setAvailableFaculties(uniqueFaculties);
        }
        // Üniversite değiştiğinde alt seçimleri sıfırla
        setSelection(prev => ({ ...prev, faculty: null, department: null }));
    }, [selection.university]);

    // Fakülte seçimi değiştiğinde bölüm listesini güncelle
    useEffect(() => {
        let departments = [];
        if (selection.university) {
            const university = universityData.find(u => u.name === selection.university);
            if (selection.faculty) {
                const faculty = university?.faculties.find(f => f.name === selection.faculty);
                departments = faculty?.departments || [];
            } else {
                // Belirli bir üniversitedeki tüm bölümler
                departments = university?.faculties.flatMap(f => f.departments) || [];
            }
        } else { // Tüm üniversiteler seçili
            if (selection.faculty) {
                // Tüm üniversitelerde bu fakülte adını ara ve bölümlerini topla
                departments = universityData
                    .flatMap(u => u.faculties)
                    .filter(f => f.name === selection.faculty)
                    .flatMap(f => f.departments);
            } else {
                // Tüm üniversitelerdeki tüm bölümler
                departments = universityData.flatMap(u => u.faculties.flatMap(f => f.departments));
            }
        }
        setAvailableDepartments([...new Set(departments)]);
        setSelection(prev => ({ ...prev, department: null }));
    }, [selection.university, selection.faculty]);


    const handleApplyFilters = () => {
        const activeFilters = Object.fromEntries(
            Object.entries(selection).filter(([_, value]) => value !== null)
        );
        onApplyFilters(activeFilters);
        navigation.goBack();
    };

    const handleResetFilters = () => {
        onApplyFilters({});
        navigation.goBack();
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.form}>
                <Text style={styles.label}>{t('universityLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.university}
                        onValueChange={(itemValue) => setSelection(prev => ({ ...prev, university: itemValue }))}
                        dropdownIconColor={theme.text}
                    >
                        <Picker.Item label={t('allOptions')} value={null} color={theme.subtext} />
                        {universityData.map(uni => <Picker.Item key={uni.name} label={uni.name} value={uni.name} color={theme.text} />)}
                    </Picker>
                </View>

                <Text style={styles.label}>{t('facultyLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.faculty}
                        onValueChange={(itemValue) => setSelection(prev => ({ ...prev, faculty: itemValue }))}
                        dropdownIconColor={theme.text}
                    >
                        <Picker.Item label={t('allOptions')} value={null} color={theme.subtext} />
                        {availableFaculties.map(fac => <Picker.Item key={fac.name} label={fac.name} value={fac.name} color={theme.text} />)}
                    </Picker>
                </View>

                <Text style={styles.label}>{t('departmentLabel')}</Text>
                <View style={styles.pickerContainer}>
                    <Picker
                        selectedValue={selection.department}
                        onValueChange={(itemValue) => setSelection(prev => ({ ...prev, department: itemValue }))}
                        dropdownIconColor={theme.text}
                    >
                        <Picker.Item label={t('allOptions')} value={null} color={theme.subtext} />
                        {availableDepartments.map(dep => <Picker.Item key={dep} label={dep} value={dep} color={theme.text} />)}
                    </Picker>
                </View>

                <TouchableOpacity style={styles.applyButton} onPress={handleApplyFilters}>
                    <Text style={styles.buttonText}>{t('applyFilters')}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.resetButton} onPress={handleResetFilters}>
                    <Text style={styles.resetButtonText}>{t('resetFilters')}</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (theme) => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    form: { padding: 20 },
    label: { fontSize: 16, color: theme.subtext, marginBottom: 8, marginLeft: 4 },
    pickerContainer: { borderWidth: 1, borderColor: theme.border, borderRadius: 8, marginBottom: 16, backgroundColor: theme.card },
    applyButton: { backgroundColor: theme.primary, paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 20 },
    buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
    resetButton: { backgroundColor: 'transparent', paddingVertical: 15, borderRadius: 8, alignItems: 'center', marginTop: 10 },
    resetButtonText: { color: theme.destructive, fontSize: 16 },
});

export default FilterScreen;