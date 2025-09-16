import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect } from 'react';
import { View } from 'react-native';

export default function PitchBar({ pitchHz, min=80, max=1000 }) {
  const h = useSharedValue(0);
  useEffect(() => {
    const clamped = Math.min(1, Math.max(0, (pitchHz - min) / (max - min)));
    h.value = withTiming(clamped, { duration: 120 });
  }, [pitchHz]);
  const style = useAnimatedStyle(() => ({
    height: 8 + h.value * 120,
    borderRadius: 6,
  }));
  return (
    <View style={{height: 140, width: 18, backgroundColor: '#111', borderRadius: 8, overflow: 'hidden'}}>
      <Animated.View style={[{ backgroundColor: '#4ade80', width: '100%' }, style]} />
    </View>
  );
}
