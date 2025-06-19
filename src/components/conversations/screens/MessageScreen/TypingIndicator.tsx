import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Avatar, Badge } from '@rneui/themed'; // Import Avatar and Badge from RNE
import { CustomColors, customTypography } from '../../../../theme/theme'; // Adjust path

interface TypingIndicatorProps {
  isTyping: boolean;
  userName?: string;
  theme: CustomColors;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isTyping, userName, theme }) => {
  const dotScales = useRef([new Animated.Value(1), new Animated.Value(1), new Animated.Value(1)]).current;

  useEffect(() => {
    let animationController: Animated.CompositeAnimation | null = null;
    if (isTyping) {
      const bounce = (anim: Animated.Value) =>
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1.4, // Scale up
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1, // Scale down
            duration: 300,
            useNativeDriver: true,
          }),
        ]);

      const animations = dotScales.map((anim, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 150),
            bounce(anim),
            Animated.delay((dotScales.length - 1 - index) * 150),
          ])
        )
      );

      animationController = Animated.parallel(animations);
      animationController.start();
    } else {
      dotScales.forEach(anim => anim.setValue(1));
    }

    return () => {
      dotScales.forEach(anim => anim.stopAnimation());
      if (animationController) {
        animationController.stop();
      }
    };
  }, [isTyping, dotScales]);

  if (!isTyping) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background1, borderBottomColor: theme.borderLight }]}>
      {userName && (
        <>
          <Avatar
            size={24}
            rounded
            title={userName.charAt(0).toUpperCase()}
            containerStyle={{ backgroundColor: theme.primary, marginRight: 8 }}
            titleStyle={{ color: theme.staticWhite, fontSize: 12 }}
          />
          <Text style={[styles.typingText, { color: theme.textSecondary }]}>
            {userName} is typing...
          </Text>
        </>
      )}
      <View style={styles.dotsContainer}>
        {dotScales.map((scaleAnim, index) => (
          <Animated.View
            key={index}
            style={{
              transform: [{ scale: scaleAnim }],
              marginHorizontal: 2,
            }}
          >
            <Badge
              badgeStyle={[styles.dot, { backgroundColor: theme.textSecondary }]}
              value=""
            />
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth, // Subtle line at the bottom
  },
  typingText: {
    ...customTypography.caption1.regular,
    fontSize: 13,
    fontStyle: 'italic',
    marginRight: 8,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default TypingIndicator;
