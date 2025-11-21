import { useState } from 'react';
import { Camera, Loader2 } from 'lucide-react';
import { recognizeText, OCRResult } from '@/lib/ocr';

interface CameraCaptureProps {
  onResult: (result: OCRResult) => void;
}

export const CameraCapture = ({ onResult }: CameraCaptureProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const result = await recognizeText(file);
      onResult(result);
    } catch (error) {
      alert('文字認識に失敗しました。もう一度お試しください。');
      console.error(error);
    } finally {
      setIsProcessing(false);
      // input要素をリセット（同じ画像を再度選択できるように）
      e.target.value = '';
    }
  };

  return (
    <div>
      <label
        htmlFor="camera-input"
        className={`flex w-full items-center justify-center gap-2 rounded-md px-4 py-2 text-white transition-colors ${isProcessing
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700 cursor-pointer'
          }`}
      >
        {isProcessing ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            認識中...
          </>
        ) : (
          <>
            <Camera size={20} />
            カメラで撮影
          </>
        )}
      </label>
      <input
        id="camera-input"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleCapture}
        disabled={isProcessing}
        className="hidden"
      />
    </div>
  );
};
