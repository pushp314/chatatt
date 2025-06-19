/* eslint-disable react-native/no-inline-styles */

import { Animated, Dimensions, Easing, StyleSheet, View, useColorScheme } from 'react-native';
import React, { useEffect, useRef } from 'react'; // Removed useState
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

const { width: screenWidth } = Dimensions.get('window');

const SkeletonBox = ({ index, boxSize, gradientColors }: {index: number, boxSize: number, gradientColors: string[]}) => {
  const isLastInRow = (index + 1) % 3 === 0;

  return (
    <Svg
      height={boxSize}
      width={boxSize}
      viewBox="0 0 100 100" // Keep viewBox consistent
      // fill="none" // Not needed here as Rect has fill
      style={[
        styles.skeletonBoxBase, // Renamed for clarity
        {width: boxSize,
          height: boxSize,
          marginRight: isLastInRow ? 0 : 8, // Spacing between boxes
        },
      ]}
    >
      <Defs>
        <LinearGradient
          id={`paint0_linear_skeleton_${index}`} // More unique ID
          x1="0%" // Use percentage for responsiveness within SVG
          y1="50%"
          x2="100%"
          y2="50%"
          // gradientUnits="userSpaceOnUse" // Default
        >
          <Stop offset="0%" stopColor={gradientColors[0]} />
          <Stop offset="100%" stopColor={gradientColors[1]} />
        </LinearGradient>
      </Defs>
      <Rect
        x="0" // Fill the entire Svg component defined by boxSize
        y="0"
        width="100" // Relative to viewBox
        height="100" // Relative to viewBox
        rx="15" // Corner radius
        ry="15"
        fill={`url(#paint0_linear_skeleton_${index})`}
      />
    </Svg>
  );
};

export const Skeleton: React.FC = () => { // Added React.FC type
  const animatedValue = useRef(new Animated.Value(0)).current;
  // Removed internal isLoading state and setTimeout
  const mode = useColorScheme();

  const staticColors = { // Renamed from 'color' to avoid conflict
    staticBlack: '#000000',
    staticWhite: '#FFFFFF',
  };

  const skeletonStyle =
    mode === 'light'
      ? {
          linearGradientColors: ['#E8E8E8', '#F5F5F5'], // Light gray shimmer
          shimmerBackgroundColor: staticColors.staticBlack, // Shimmer effect color
          shimmerOpacity: 0.03, // Subtle shimmer
          speed: 1.2, // Slightly faster shimmer
        }
      : {
          linearGradientColors: ['#383838', '#272727'], // Dark gray shimmer
          shimmerBackgroundColor: staticColors.staticWhite,
          shimmerOpacity: 0.04,
          speed: 1.2,
        };

  const { linearGradientColors, shimmerBackgroundColor, shimmerOpacity, speed } = skeletonStyle;

  useEffect(() => {
    const startShimmer = () => {
      animatedValue.setValue(0); // Reset animation value
      Animated.loop(
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: (1 / speed) * 1000, // Duration based on speed
          easing: Easing.linear,
          useNativeDriver: false, // Needed for non-transform animations or SVG
        })
      ).start();
    };
    startShimmer();
  }, [animatedValue, speed]); // Rerun animation if speed changes

  const shimmerTranslateX = animatedValue.interpolate({
    inputRange: [0, 0.5, 1], // inputRange for a more dynamic shimmer
    outputRange: [-screenWidth * 0.5, 0, screenWidth * 0.5], // Shimmer moves across
  });

  // Parent component (SampleUser) controls when Skeleton is rendered.
  // No internal 'isLoading' check needed here.

  const numColumns = 3;
  const totalSpacing = (numColumns - 1) * 8; // 8 is marginRight from SkeletonBox
  const boxSize = (screenWidth - (2 * 16) - totalSpacing) / numColumns; // 16 is horizontal padding of parent
  const shimmerWidth = screenWidth * 0.8; // Shimmer effect width
  const shimmerHeight = boxSize * 2 + 10 + 20; // Approximate height of 2 rows of boxes + margins + padding

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {/* Render a fixed number of skeleton boxes, e.g., 2 rows */}
        {new Array(6).fill(0).map((_, index) => (
          <SkeletonBox
            key={`skeleton-${index}`}
            index={index}
            boxSize={boxSize}
            gradientColors={linearGradientColors}
          />
        ))}
      </View>
      <Animated.View
        style={[
          styles.animatedShimmer,
          {
            width: shimmerWidth,
            height: shimmerHeight, // Cover the area of skeleton boxes
            transform: [{ translateX: shimmerTranslateX }, {skewX: '-20deg'}], // Skewed shimmer
            backgroundColor: shimmerBackgroundColor,
            opacity: shimmerOpacity,
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative', // For absolute positioning of shimmer
    // borderRadius: 16, // Can be applied if the whole skeleton area has rounded corners
    overflow: 'hidden', // Important for the shimmer effect
    paddingVertical: 10, // Padding around the grid
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // justifyContent: "space-between", // Let marginRight handle spacing
  },
  skeletonBoxBase: { // Base style for each Svg box
    marginBottom: 10, // Spacing between rows
    // marginRight is handled inline in SkeletonBox for last item in row
    borderRadius: 15, // Apply borderRadius to SVG if not on Rect
  },
  animatedShimmer: {
    position: 'absolute',
    top: 0, // Align with the top of the container
    left: '-25%', // Start shimmer from off-screen
    // width, height, transform, backgroundColor, opacity are set dynamically
    zIndex: 1, // Ensure shimmer is on top of boxes if needed, or below if it's a background effect
  },
});

export default Skeleton;
