import { useEffect, useRef, useState } from "react";

interface Detector {
  detect: (source: HTMLVideoElement) => Promise<{ rawValue: string }[]>;
}
type DetectorConstructor = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats: () => Promise<string[]>;
};
export function useScanner(onRead: (value: string) => void) {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<number | undefined>(undefined);
  const generation = useRef(0);
  const [active, setActive] = useState(false);
  const [error, setError] = useState("");
  function stop() {
    generation.current++;
    window.clearTimeout(timer.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setActive(false);
  }
  useEffect(
    () => () => {
      generation.current++;
      window.clearTimeout(timer.current);
      stream.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );
  async function start() {
    stop();
    setError("");
    const run = generation.current;
    try {
      const Constructor = (
        window as unknown as { BarcodeDetector?: DetectorConstructor }
      ).BarcodeDetector;
      if (!Constructor || !navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "A leitura automática não está disponível neste navegador. Digite o ISBN abaixo.",
        );
      const formats = (await Constructor.getSupportedFormats()).filter((f) =>
        ["ean_13", "ean_8", "code_128", "code_39"].includes(f),
      );
      if (!formats.length)
        throw new Error(
          "Este navegador não reconhece os formatos necessários. Digite o código abaixo.",
        );
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (run !== generation.current) {
        media.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = media;
      const element = video.current;
      if (!element) {
        stop();
        return;
      }
      element.srcObject = media;
      await element.play();
      if (run !== generation.current) return;
      setActive(true);
      const detector = new Constructor({ formats });
      const scan = async () => {
        if (run !== generation.current) return;
        try {
          const values = await detector.detect(element);
          if (run !== generation.current) return;
          if (values[0]) {
            stop();
            onRead(values[0].rawValue);
            return;
          }
        } catch {
          if (run === generation.current) {
            stop();
            setError(
              "Não foi possível ler a câmera. Tente novamente ou digite o código.",
            );
          }
          return;
        }
        timer.current = window.setTimeout(scan, 250);
      };
      void scan();
    } catch (e) {
      if (run === generation.current) {
        stop();
        setError(
          e instanceof DOMException
            ? "Não foi possível acessar a câmera. Verifique a permissão e tente novamente."
            : (e as Error).message,
        );
      }
    }
  }
  return { video, active, error, start, stop };
}
