import { useRef, useEffect } from 'react';
import { View } from 'react-native';
import LottieView from 'lottie-react-native';

export default function HitSpark({ trigger }) {
  const ref = useRef(null);
  useEffect(() => { if (trigger) ref.current?.play(0, 60); }, [trigger]);
  return (
    <View style={{ position: 'absolute', width: 48, height: 48, left: -12, top: -12 }}>
      <LottieView ref={ref} source={require('../assets/lottie/spark.json')} loop={false} />
    </View>
  );
}
