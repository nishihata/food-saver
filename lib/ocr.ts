import Tesseract from 'tesseract.js';

export interface OCRResult {
  text: string;
  expirationDate?: string;
  productName?: string;
}

/**
 * 画像からテキストを認識する
 */
export const recognizeText = async (imageFile: File): Promise<OCRResult> => {
  try {
    const result = await Tesseract.recognize(imageFile, 'jpn+eng', {
      logger: (m) => console.log(m), // 進捗ログ
    });

    const text = result.data.text;
    const expirationDate = extractExpirationDate(text);
    const productName = extractProductName(text);

    return {
      text,
      expirationDate,
      productName,
    };
  } catch (error) {
    console.error('OCR処理に失敗しました', error);
    throw new Error('文字認識に失敗しました');
  }
};

/**
 * テキストから消費期限を抽出する
 * 対応形式: 2025/11/22, 2025.11.22, 2025-11-22, 25/11/22 など
 */
const extractExpirationDate = (text: string): string | undefined => {
  // 日付パターンの正規表現
  const patterns = [
    // YYYY/MM/DD, YYYY.MM.DD, YYYY-MM-DD
    /(\d{4})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/,
    // YY/MM/DD, YY.MM.DD, YY-MM-DD
    /(\d{2})[\/\.\-](\d{1,2})[\/\.\-](\d{1,2})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let year = match[1];
      const month = match[2].padStart(2, '0');
      const day = match[3].padStart(2, '0');

      // 2桁の年を4桁に変換（20XX年として扱う）
      if (year.length === 2) {
        year = `20${year}`;
      }

      return `${year}-${month}-${day}`;
    }
  }

  return undefined;
};

/**
 * テキストから商品名を抽出する（簡易版）
 * 最初の行または最も長い行を商品名として扱う
 */
const extractProductName = (text: string): string | undefined => {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);

  if (lines.length === 0) return undefined;

  // 最も長い行を商品名として扱う（ラベルでは商品名が大きく書かれていることが多いため）
  const longestLine = lines.reduce((a, b) => (a.length > b.length ? a : b));

  return longestLine.trim();
};
