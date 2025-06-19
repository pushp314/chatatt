import React from 'react';
import { View, Text, StyleSheet, useColorScheme } from 'react-native';
import { customThemeColorsLight, customThemeColorsDark } from '../../theme/theme'; // Adjust path if needed
import { useRoute } from '@react-navigation/native';


const CallDetails: React.FC = () => {
  const scheme = useColorScheme();
  const route = useRoute();
const { userId, userName } = route.params as { userId: string; userName: string };

  const theme = scheme === 'dark' ? customThemeColorsDark : customThemeColorsLight;

  return (
    <View style={[styles.container, { backgroundColor: theme.background1 }]}>
      <Text style={[styles.text, { color: theme.textPrimary }]}> hello Call Details Screen</Text>
      <Text style={[styles.text, { color: theme.textPrimary }]}>
  Hello {userName} (ID: {userId})
</Text>

      {/* Implement your Call Details UI here */}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 18,
  },
});

export default CallDetails;