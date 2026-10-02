import { analyzeImage } from '../../../lib/analysis.ts';
import { AnalysisError, readBounded } from '../../../lib/errors.ts';
import { MAX_IMAGE_BYTES, validateImage } from '../../../lib/upload.ts';
export const runtime = 'nodejs';
function json(data: unknown,status = 200) { return Response.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export async function POST(request: Request): Promise<Response> {
  try {
    if (request.headers.get('origin') !== new URL(request.url).origin || request.headers.get('sec-fetch-site') === 'cross-site') throw new AnalysisError('Please open the checker on this computer and try again.',403);
    const type = request.headers.get('content-type') ?? '';
    if (!type.startsWith('multipart/form-data;')) throw new AnalysisError('Choose a screenshot to check.',400);
    const maxBody = MAX_IMAGE_BYTES+65536;
    if (Number(request.headers.get('content-length')) > maxBody) throw new AnalysisError('That upload is too large. Choose an image under 8 MB.',413);
    const bytes = await readBounded(request.body,maxBody);
    let form: FormData;
    try { form = await new Response(new Uint8Array(bytes),{headers:{'Content-Type':type}}).formData(); }
    catch { throw new AnalysisError('That upload could not be read. Choose the screenshot again.',400); }
    const entries = [...form.entries()];
    const image = form.get('image');
    if (entries.length !== 1 || !(image instanceof File)) throw new AnalysisError('Choose one screenshot at a time.',400);
    const imageBytes = Buffer.from(await image.arrayBuffer());
    await validateImage(imageBytes,image.type);
    return json(await analyzeImage(imageBytes));
  } catch(error) {
    if (error instanceof AnalysisError) return json({error:error.message},error.status);
    return json({error:'The checker could not finish. Please try again, or ask someone you trust.'},503);
  }
}
