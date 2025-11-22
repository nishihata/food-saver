export interface OCRResult {
  text: string;
  expirationDate?: string;
  productName?: string;
  category?: string;
}

/**
 * 画像からテキストを認識する（APIルート経由）
 */
export const recognizeText = async (imageFile: File): Promise<OCRResult> => {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);

    const response = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '文字認識に失敗しました');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('OCR処理に失敗しました', error);
    throw new Error('文字認識に失敗しました。もう一度お試しください。');
  }
};
