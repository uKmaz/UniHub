import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const RegisterScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Kayıt Ol</Text>
            {/* Buraya kayıt formunun elemanları gelecek */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        textAlign: 'center',
    }
});

export default RegisterScreen;