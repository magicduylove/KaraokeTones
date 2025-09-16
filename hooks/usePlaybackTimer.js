import { useEffect, useRef, useState } from 'react';

export default function usePlaybackTimer({ score, tempo = 1.0, intervalMs = 100 }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const [targetNote, setTargetNote] = useState(null);
  const timerRef = useRef(null);

  const midiToFrequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);

  const start = () => {
    if (!score?.length || timerRef.current) return;
    setIsPlaying(true);
    timerRef.current = setInterval(() => {
      setPlaybackPosition((prev) => {
        const pos = prev + (intervalMs / 1000) * tempo;
        const cur = score.find(n => pos >= n.start && pos < n.start + n.dur) || null;
        setTargetNote(cur ? { ...cur, frequency: midiToFrequency(cur.midi) } : null);
        const end = score[score.length - 1].start + score[score.length - 1].dur;
        return pos > end ? 0 : pos;
      });
    }, intervalMs);
  };

  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    setIsPlaying(false);
    setPlaybackPosition(0);
    setTargetNote(null);
  };

  useEffect(() => () => stop(), []); // cleanup on unmount
  return { isPlaying, playbackPosition, targetNote, start, stop };
}
