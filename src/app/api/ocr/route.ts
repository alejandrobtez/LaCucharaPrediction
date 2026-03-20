import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Azure Document Intelligence OCR
    const endpoint = (process.env.AZURE_OCR_ENDPOINT || '').trim();
    const key = (process.env.AZURE_OCR_KEY || '').trim();

    // Eliminar barra final si existe para evitar // en la URL
    const baseUrl = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    
    // Intentamos con la versión GA de Form Recognizer v3.1 (2023-07-31)
    const analyzeUrl = `${baseUrl}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31`;

    console.log('--- AZURE OCR DEBUG ---');
    console.log('URL:', analyzeUrl);
    console.log('Key length:', key.length);

    const analyzeRes = await fetch(analyzeUrl, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': file.type || 'image/jpeg',
      },
      body: buffer,
    });

    if (!analyzeRes.ok) {
      const errText = await analyzeRes.text();
      return NextResponse.json({ error: 'Error en Azure OCR: ' + errText }, { status: 500 });
    }

    const operationUrl = analyzeRes.headers.get('Operation-Location');
    if (!operationUrl) return NextResponse.json({ error: 'No se obtuvo URL de operación de Azure.' }, { status: 500 });

    // Poll for result
    let result: any = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(r => setTimeout(r, 2000));
      const pollRes = await fetch(operationUrl, { headers: { 'Ocp-Apim-Subscription-Key': key } });
      const pollData = await pollRes.json();
      if (pollData.status === 'succeeded') { result = pollData; break; }
      if (pollData.status === 'failed') return NextResponse.json({ error: 'Azure OCR falló.' }, { status: 500 });
    }

    if (!result) return NextResponse.json({ error: 'Timeout esperando OCR.' }, { status: 504 });

    const content = result.analyzeResult?.content || '';

    // Azure OpenAI to structure
    const aoaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT!;
    const aoaiKey = process.env.AZURE_OPENAI_KEY!;
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o-mini';

    const llmRes = await fetch(`${aoaiEndpoint}openai/deployments/${deployment}/chat/completions?api-version=2024-02-15-preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'api-key': aoaiKey },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: 'Eres un asistente que extrae menús de restaurantes. Devuelve JSON válido con campos: precio (número), platos (array de {nombre, categoria (Primero/Segundo/Postre), ingredientes_principales}).' },
          { role: 'user', content: `Extrae el menú de este texto: ${content}` }
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      })
    });

    const llmData = await llmRes.json();
    const parsed = JSON.parse(llmData.choices?.[0]?.message?.content || '{}');

    return NextResponse.json({ platos: parsed.platos || [], precio: parsed.precio || 12 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
