import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextRequest, NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      return NextResponse.json({ error: '画像がありません' }, { status: 400 });
    }

    // 画像をBase64に変換
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Gemini 2.5 Flashモデルを使用（公式ドキュメント確認済み）
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
この画像は食品のラベルです。以下の情報を抽出してください：

1. 商品名
2. 消費期限または賞味期限（YYYY-MM-DD形式で）

以下のJSON形式で回答してください：
{
  "productName": "商品名",
  "expirationDate": "YYYY-MM-DD",
  "rawText": "画像から読み取った全テキスト"
}

日付が複数ある場合は、最も遅い日付を選んでください。
日付が見つからない場合は、expirationDateをnullにしてください。
`;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: file.type,
          data: base64Image,
        },
      },
    ]);

    const response = await result.response;
    const text = response.text();

    // JSONを抽出
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'JSONレスポンスが見つかりませんでした' }, { status: 500 });
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return NextResponse.json({
      text: parsed.rawText || text,
      expirationDate: parsed.expirationDate || undefined,
      productName: parsed.productName || undefined,
    });
  } catch (error) {
    console.error('OCR処理に失敗しました', error);
    return NextResponse.json(
      { error: '文字認識に失敗しました。もう一度お試しください。' },
      { status: 500 }
    );
  }
}
