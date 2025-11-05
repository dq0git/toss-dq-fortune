import { useCallback, useState, useRef } from 'react';

export interface ImageState {
  id: string;
  dataUri: string;
  previewUri: string;
}

interface UseCameraProps {
  base64?: boolean;
}

export function useCamera({ base64 = false }: UseCameraProps = {}) {
  const [image, setImage] = useState<ImageState | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
        videoRef.current.play();
      }
    } catch (error) {
      console.error('카메라 접근 실패:', error);
      throw new Error('카메라를 사용할 수 없습니다.');
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) {
      throw new Error('카메라가 초기화되지 않았습니다.');
    }

    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');

    if (!context) throw new Error('캔버스 컨텍스트를 얻을 수 없습니다.');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    let dataUri: string;
    if (base64) {
      dataUri = canvas.toDataURL('image/jpeg', 0.8);
    } else {
      dataUri = canvas.toDataURL('image/jpeg', 0.8);
    }

    const newImage: ImageState = {
      id: Date.now().toString(),
      dataUri,
      previewUri: dataUri,
    };

    setImage(newImage);
    stopCamera();
  }, [base64, stopCamera]);

  const clearPhoto = useCallback(() => {
    setImage(null);
  }, []);

  return {
    image,
    capturePhoto,
    clearPhoto,
    startCamera,
    stopCamera,
    isStreaming,
    videoRef,
    canvasRef
  };
}
