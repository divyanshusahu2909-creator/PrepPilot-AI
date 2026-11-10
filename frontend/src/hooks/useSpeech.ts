import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Browser speech hook: speech-to-text (with confidence + duration metrics)
 * and text-to-speech. Works in Chrome/Edge/Safari; Firefox has no STT —
 * callers should fall back to typed input when isSpeechSupported is false.
 */
export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastConfidence, setLastConfidence] = useState<number | null>(null);
  const [lastDurationSeconds, setLastDurationSeconds] = useState(0);

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const startTimeRef = useRef<number>(0);
  const confidencesRef = useRef<number[]>([]);
  const listeningRef = useRef(false);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      setIsSpeechSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            final += result[0].transcript;
            if (result[0].confidence > 0) confidencesRef.current.push(result[0].confidence);
          } else {
            interim += result[0].transcript;
          }
        }
        if (final) setTranscript((prev) => prev + final + ' ');
        setInterimTranscript(interim);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setError('Microphone access was denied. Please allow microphone permissions in your browser.');
        } else if (event.error === 'network') {
          setError('Speech recognition needs a network connection in this browser.');
        } else if (event.error !== 'aborted' && event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
        listeningRef.current = false;
        setIsListening(false);
      };

      recognition.onend = () => {
        // Chrome stops recognition after silence — restart while the user is still recording.
        if (listeningRef.current) {
          try {
            recognition.start();
            return;
          } catch {
            // fall through to stopped state
          }
        }
        setIsListening(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
    }

    if (window.speechSynthesis) synthRef.current = window.speechSynthesis;

    return () => {
      listeningRef.current = false;
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const startListening = useCallback(async () => {
    setError(null);
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Use Chrome or Edge, or type your answer.');
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setTranscript('');
      setInterimTranscript('');
      confidencesRef.current = [];
      startTimeRef.current = Date.now();
      listeningRef.current = true;
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setError('Microphone access was denied. Please allow microphone permissions and try again.');
    }
  }, []);

  const stopListening = useCallback(() => {
    listeningRef.current = false;
    recognitionRef.current?.stop();
    setIsListening(false);
    if (startTimeRef.current > 0) {
      setLastDurationSeconds(Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000)));
      startTimeRef.current = 0;
    }
    const confs = confidencesRef.current;
    setLastConfidence(confs.length ? confs.reduce((a, b) => a + b, 0) / confs.length : null);
  }, []);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (!synthRef.current) {
        reject(new Error('Speech synthesis is not supported in this browser.'));
        return;
      }
      synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      const pickVoice = () => {
        const voices = synthRef.current!.getVoices();
        return (
          voices.find((v) => v.lang === 'en-US' && /google|natural|neural/i.test(v.name)) ||
          voices.find((v) => v.lang === 'en-US') ||
          voices.find((v) => v.lang.startsWith('en')) ||
          null
        );
      };
      const voice = pickVoice();
      if (voice) utterance.voice = voice;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        setIsSpeaking(false);
        if (e.error === 'canceled' || e.error === 'interrupted') resolve();
        else reject(new Error(`Speech synthesis error: ${e.error}`));
      };
      synthRef.current.speak(utterance);
    });
  }, []);

  const stopSpeaking = useCallback(() => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSpeechSupported,
    isSpeaking,
    error,
    lastConfidence,
    lastDurationSeconds,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    resetTranscript,
  };
}