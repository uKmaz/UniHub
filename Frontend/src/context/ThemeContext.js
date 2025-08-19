 import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Açık mod renkleri
const lightColors = {
    background: '#f0f2f5', // Açık gri arka plan
    card: 'white',         // Beyaz kartlar
    text: '#1c1c1e',         // Neredeyse siyah metin
    subtext: '#6e6e72',      // Gri alt metin
    border: '#e0e0e0',       // Açık gri sınırlar
    primary: '#007AFF',      // Mavi ana renk
    destructive: '#FF3B30',  // Kırmızı tehlike rengi
};

// --- YENİ VE GELİŞTİRİLMİŞ KARANLIK MOD RENKLERİ ---
const darkColors = {
    background: '#121212', // Saf siyah yerine çok koyu bir gri (daha göz yormaz)
    card: '#1E1E1E',         // Arka plandan biraz daha açık bir kart rengi
    text: '#E1E1E1',         // Saf beyaz yerine hafif kırık beyaz (daha az parlama yapar)
    subtext: '#A9A9A9',      // Daha iyi kontrast için daha açık bir gri alt metin
    border: '#272727',       // Çok ince ve belli belirsiz bir sınır rengi
    primary: '#0A84FF',      // Canlı bir mavi
    destructive: '#FF453A',  // Canlı bir kırmızı
};

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const systemScheme = useColorScheme();
    const [isDarkMode, setIsDarkMode] = useState(systemScheme === 'dark');

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
