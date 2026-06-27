import { useCallback } from "react";

export const useAudio = () => {
  const playNotification = useCallback(() => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      // Short notification chirp base tone
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      gain1.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.15,
      );

      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.15);

      // higher note after a short delay
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.0, audioCtx.currentTime + 0.08); // A5
      gain2.gain.setValueAtTime(0.15, audioCtx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(
        0.001,
        audioCtx.currentTime + 0.25,
      );

      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(audioCtx.currentTime + 0.08);
      osc2.stop(audioCtx.currentTime + 0.25);
    } catch (error) {
      console.warn("Web Audio API not supported or blocked by browser:", error);
    }
  }, []);

  return { playNotification };
};
