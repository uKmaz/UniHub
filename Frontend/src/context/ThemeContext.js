import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Renk paletlerini tanımla
const lightColors = {
    background: '#f0f2f5',
    card: 'white',
    text: '#1c1c1e',
    subtext: '#6e6e72',
    border: '#e0e0e0',
    primary: '#007AFF',
    destructive: '#FF3B30',
};

const darkColors = {
    background: '#000000',
    card: '#1c1c1e',
    text: '#ffffff',
    subtext: '#8e8e93',
    border: '#38383a',
    primary: '#0A84FF',
    destructive: '#FF453A',
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme(); // Cihazın tema tercihini al
    const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

    // Uygulama ilk açıldığında kaydedilmiş temayı yükle
    useEffect(() => {
        const loadTheme = async () => {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme !== null) {
                setIsDarkMode(savedTheme === 'dark');
            }
        };
        loadTheme();
    }, []);

    const toggleTheme = async () => {
        const newIsDarkMode = !isDarkMode;
        setIsDarkMode(newIsDarkMode);
        await AsyncStorage.setItem('theme', newIsDarkMode ? 'dark' : 'light');
    };

    const theme = isDarkMode ? darkColors : lightColors;

    return (
        <ThemeContext.Provider value={{ isDarkMode, theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => useContext(ThemeContext);