/**
 * ScanFrame — Camera overlay with corner-only strokes
 * For the AI camera scan viewfinder
 */
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Colors from '../constants/Colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FRAME_SIZE = SCREEN_WIDTH * 0.75;
const CORNER_LENGTH = 40;
const CORNER_THICKNESS = 3;
const CORNER_RADIUS = 24;

interface ScanFrameProps {
  isScanning?: boolean;
}

export default function ScanFrame({ isScanning = false }: ScanFrameProps) {
  const scanLineY = useSharedValue(0);

  useEffect(() => {
    if (isScanning) {
      scanLineY.value = withRepeat(
        withTiming(FRAME_SIZE - 4, {
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      scanLineY.value = 0;
    }
  }, [isScanning]);

  const scanLineStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: scanLineY.value }],
    opacity: isScanning ? 1 : 0,
  }));

  return (
    <View style={styles.container}>
      {/* Top-left corner */}
      <View style={[styles.corner, styles.topLeft]}>
        <View style={[styles.cornerH, styles.cornerHorizontal]} />
        <View style={[styles.cornerV, styles.cornerVertical]} />
      </View>

      {/* Top-right corner */}
      <View style={[styles.corner, styles.topRight]}>
        <View style={[styles.cornerH, styles.cornerHorizontal]} />
        <View style={[styles.cornerV, styles.cornerVertical]} />
      </View>

      {/* Bottom-left corner */}
      <View style={[styles.corner, styles.bottomLeft]}>
        <View style={[styles.cornerH, styles.cornerHorizontal]} />
        <View style={[styles.cornerV, styles.cornerVertical]} />
      </View>

      {/* Bottom-right corner */}
      <View style={[styles.corner, styles.bottomRight]}>
        <View style={[styles.cornerH, styles.cornerHorizontal]} />
        <View style={[styles.cornerV, styles.cornerVertical]} />
      </View>

      {/* Scan line */}
      {isScanning && (
        <Animated.View style={[styles.scanLine, scanLineStyle]} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: FRAME_SIZE,
    height: FRAME_SIZE,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: CORNER_LENGTH,
    height: CORNER_LENGTH,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    transform: [{ scaleX: -1 }],
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    transform: [{ scaleY: -1 }],
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    transform: [{ scaleX: -1 }, { scaleY: -1 }],
  },
  cornerHorizontal: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_LENGTH,
    height: CORNER_THICKNESS,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerVertical: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CORNER_THICKNESS,
    height: CORNER_LENGTH,
    backgroundColor: Colors.primary,
    borderTopLeftRadius: CORNER_RADIUS,
  },
  cornerH: {},
  cornerV: {},
  scanLine: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 2,
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 5,
  },
});
