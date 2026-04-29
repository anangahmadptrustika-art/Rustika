import { useEffect, useRef, useState } from "react";

/**
 * Web Speech API hook for Indonesian voice recognition.
 * Returns: { supported, listening, transcript, start, stop, reset }
 */
export default function useVoiceCommand({ lang = "id-ID", onFinal } = {}) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const onFinalRef = useRef(onFinal);

  useEffect(() => { onFinalRef.current = onFinal; }, [onFinal]);

  const supported = typeof window !== "undefined" &&
    (window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    if (!supported) return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = false;
    rec.maxAlternatives = 1;

    rec.onresult = (event) => {
      let interim = "";
      let finalText = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) finalText += res[0].transcript;
        else interim += res[0].transcript;
      }
      setTranscript(finalText || interim);
      if (finalText && onFinalRef.current) {
        onFinalRef.current(finalText.trim());
      }
    };
    rec.onerror = (e) => {
      setError(e.error || "Kesalahan suara");
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    return () => {
      try { rec.stop(); } catch {}
    };
  }, [lang, supported]);

  const start = () => {
    if (!recognitionRef.current) return;
    setError(null);
    setTranscript("");
    try {
      recognitionRef.current.start();
      setListening(true);
    } catch (e) {
      setError(e.message);
    }
  };
  const stop = () => {
    try { recognitionRef.current?.stop(); } catch {}
    setListening(false);
  };
  const reset = () => { setTranscript(""); setError(null); };

  return { supported: !!supported, listening, transcript, error, start, stop, reset };
}
