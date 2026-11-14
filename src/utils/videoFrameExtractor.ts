export interface ExtractedVideoFrame {
  id: string;
  url: string;
  timestampSeconds: number;
  timestampFormatted: string;
  width: number;
  height: number;
  aspectRatio: string;
  lumaMean: number;
  contrastScore: number;
  isAutoRecommended: boolean;
}

export interface VideoFrameExtractionResult {
  success: boolean;
  mediaKey?: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
  orientation: 'landscape' | 'portrait' | 'square';
  frames: ExtractedVideoFrame[];
  recommendedThumbnailUrl: string;
  error?: string;
}

export function isStockOrPlaceholderThumbnail(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return true;
  const trimmed = url.trim().toLowerCase();
  if (!trimmed) return true;
  if (
    trimmed.includes('unsplash.com') ||
    trimmed.includes('picsum.photos') ||
    trimmed.includes('via.placeholder') ||
    trimmed.includes('creator_cover_luxury_')
  ) {
    return true;
  }
  return false;
}

export function formatVideoTimestamp(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function computeAspectRatioLabel(width: number, height: number): string {
  if (!width || !height) return '16:9';
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(ratio - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(ratio - 4 / 3) < 0.08) return '4:3';
  if (Math.abs(ratio - 4 / 5) < 0.08) return '4:5';
  if (Math.abs(ratio - 1) < 0.08) return '1:1';
  if (Math.abs(ratio - 2.4) < 0.15) return '2.4:1';
  return `${ratio.toFixed(2)}:1`;
}

export function getLocalSampleThumbnails(_videoUrl?: string): {
  thumbnailUrl: string;
  previewFrames: string[];
  width: number;
  height: number;
  durationSeconds: number;
  frames: ExtractedVideoFrame[];
} | null {
  return null;
}

function measureCanvasLumaContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
): { lumaMean: number; contrastScore: number } {
  try {
    const sampleW = Math.min(width, 160);
    const sampleH = Math.min(height, 90);
    const imgData = ctx.getImageData(0, 0, sampleW, sampleH).data;
    const step = 4 * 4;
    let count = 0;
    let sum = 0;
    let sumSq = 0;
    let minLuma = 255;
    let maxLuma = 0;

    for (let i = 0; i < imgData.length; i += step) {
      const r = imgData[i];
      const g = imgData[i + 1];
      const b = imgData[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      sum += luma;
      sumSq += luma * luma;
      if (luma < minLuma) minLuma = luma;
      if (luma > maxLuma) maxLuma = luma;
      count += 1;
    }

    if (count === 0) return { lumaMean: 0, contrastScore: 0 };
    const mean = sum / count;
    const variance = Math.max(0, sumSq / count - mean * mean);
    const stdDev = Math.sqrt(variance);
    const dynamicRange = maxLuma - minLuma;
    const isBadExposure = mean < 20 || mean > 240 || dynamicRange < 24 || stdDev < 8;
    const contrastScore = Math.round(stdDev * 2.5 + dynamicRange * 0.5 - (isBadExposure ? 160 : 0));
    return { lumaMean: Math.round(mean), contrastScore };
  } catch {
    return { lumaMean: 110, contrastScore: 75 };
  }
}

async function extractFramesViaBrowserCanvas(params: {
  source: File | string;
  videoMediaId?: string;
  postId?: string;
  creatorId?: string;
}): Promise<VideoFrameExtractionResult> {
  const isFile = params.source instanceof File;
  const objectUrl = isFile ? URL.createObjectURL(params.source as File) : (params.source as string);

  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    if (!isFile && objectUrl.startsWith('http')) {
      video.crossOrigin = 'anonymous';
    }

    let settled = false;
    const cleanup = () => {
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
        if (isFile) URL.revokeObjectURL(objectUrl);
      } catch {
        // ignore cleanup errors
      }
    };

    const fail = (message: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(overallTimer);
      cleanup();
      resolve({
        success: false,
        durationSeconds: 0,
        width: 0,
        height: 0,
        aspectRatio: '16:9',
        orientation: 'landscape',
        frames: [],
        recommendedThumbnailUrl: '',
        error: message
      });
    };

    const overallTimer = setTimeout(() => {
      fail('Timed out while extracting cover frames from the uploaded video.');
    }, 25000);

    video.onerror = () => {
      fail('Unable to decode video stream for frame extraction. Please retry or try an MP4/MOV/WebM video.');
    };

    video.onloadedmetadata = async () => {
      try {
        const rawDur = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 10;
        const origW = video.videoWidth || 1280;
        const origH = video.videoHeight || 720;
        if (!origW || !origH) {
          fail('Video stream reported invalid frame dimensions.');
          return;
        }

        // Preserve exact aspect ratio while optimizing thumbnail dimensions for web/mobile
        const maxEdge = 1280;
        let outW = origW;
        let outH = origH;
        if (origW >= origH && origW > maxEdge) {
          outW = maxEdge;
          outH = Math.max(2, Math.round((origH * maxEdge) / origW));
        } else if (origH > origW && origH > maxEdge) {
          outH = maxEdge;
          outW = Math.max(2, Math.round((origW * maxEdge) / origH));
        }
        // Keep even dimensions
        outW = outW % 2 === 0 ? outW : outW - 1;
        outH = outH % 2 === 0 ? outH : outH - 1;

        const aspectRatio = computeAspectRatioLabel(origW, origH);
        const orientation: 'landscape' | 'portrait' | 'square' =
          origW === origH ? 'square' : origW > origH ? 'landscape' : 'portrait';

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          fail('Browser canvas context unavailable for frame extraction.');
          return;
        }

        const sampleRatios = [0.08, 0.22, 0.36, 0.52, 0.68, 0.84];
        const targetTimes = Array.from(
          new Set(
            sampleRatios.map(r =>
              Number(Math.min(Math.max(0.15, rawDur * r), Math.max(0.2, rawDur - 0.15)).toFixed(2))
            )
          )
        );

        const rawCaptures: Array<{
          dataUrl: string;
          timestampSeconds: number;
          timestampFormatted: string;
          width: number;
          height: number;
          aspectRatio: string;
          lumaMean: number;
          contrastScore: number;
        }> = [];

        for (const t of targetTimes) {
          await new Promise<void>(seekDone => {
            let done = false;
            const finishSeek = () => {
              if (done) return;
              done = true;
              video.removeEventListener('seeked', onSeeked);
              clearTimeout(seekTimer);
              seekDone();
            };
            const onSeeked = () => {
              try {
                ctx.drawImage(video, 0, 0, outW, outH);
                const stats = measureCanvasLumaContrast(ctx, outW, outH);
                const dataUrl = canvas.toDataURL('image/webp', 0.84);
                if (dataUrl && dataUrl.startsWith('data:image/')) {
                  rawCaptures.push({
                    dataUrl,
                    timestampSeconds: t,
                    timestampFormatted: formatVideoTimestamp(t),
                    width: outW,
                    height: outH,
                    aspectRatio,
                    lumaMean: stats.lumaMean,
                    contrastScore: stats.contrastScore
                  });
                }
              } catch {
                // ignore frame draw failure at this timestamp
              }
              finishSeek();
            };
            const seekTimer = setTimeout(finishSeek, 3200);
            video.addEventListener('seeked', onSeeked);
            try {
              video.currentTime = t;
            } catch {
              finishSeek();
            }
          });
        }

        // Filter black/blank frames if we have at least one non-black frame
        const nonBlack = rawCaptures.filter(f => f.lumaMean >= 20 && f.lumaMean <= 240 && f.contrastScore > 0);
        const finalCaptures = nonBlack.length > 0 ? nonBlack : rawCaptures;

        if (finalCaptures.length === 0) {
          fail('No non-black frames could be extracted from this video.');
          return;
        }

        let bestIdx = 0;
        let bestScore = -Infinity;
        finalCaptures.forEach((f, idx) => {
          if (f.contrastScore > bestScore) {
            bestScore = f.contrastScore;
            bestIdx = idx;
          }
        });

        // Upload extracted WebP frames to backend thumbnail storage
        try {
          const saveResp = await fetch('/api/videos/save-extracted-frames', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              frames: finalCaptures,
              selectedIndex: bestIdx,
              videoMediaId: params.videoMediaId,
              postId: params.postId,
              creatorId: params.creatorId,
              durationSeconds: Math.max(1, Math.round(rawDur)),
              width: origW,
              height: origH,
              aspectRatio
            })
          });
          if (saveResp.ok) {
            const savedData = await saveResp.json();
            if (savedData?.success && Array.isArray(savedData.frames) && savedData.frames.length > 0) {
              settled = true;
              clearTimeout(overallTimer);
              cleanup();
              resolve({
                success: true,
                mediaKey: savedData.mediaKey,
                durationSeconds: savedData.durationSeconds || Math.max(1, Math.round(rawDur)),
                width: savedData.width || origW,
                height: savedData.height || origH,
                aspectRatio: savedData.aspectRatio || aspectRatio,
                orientation: savedData.orientation || orientation,
                frames: savedData.frames,
                recommendedThumbnailUrl: savedData.recommendedThumbnailUrl || savedData.frames[0].url
              });
              return;
            }
          }
        } catch {
          // fallback to local WebP data URLs generated from actual video frames
        }

        const localFrames: ExtractedVideoFrame[] = finalCaptures.map((f, idx) => ({
          id: `browser_frame_${idx + 1}`,
          url: f.dataUrl,
          timestampSeconds: f.timestampSeconds,
          timestampFormatted: f.timestampFormatted,
          width: f.width,
          height: f.height,
          aspectRatio: f.aspectRatio,
          lumaMean: f.lumaMean,
          contrastScore: f.contrastScore,
          isAutoRecommended: idx === bestIdx
        }));

        settled = true;
        clearTimeout(overallTimer);
        cleanup();
        resolve({
          success: true,
          durationSeconds: Math.max(1, Math.round(rawDur)),
          width: origW,
          height: origH,
          aspectRatio,
          orientation,
          frames: localFrames,
          recommendedThumbnailUrl: localFrames[bestIdx]?.url || localFrames[0].url
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Browser frame extraction failed.';
        fail(msg);
      }
    };

    video.src = objectUrl;
  });
}

export async function extractVideoCoverFrames(params: {
  file?: File;
  sourceUrl?: string;
  videoMediaId?: string;
  postId?: string;
  creatorId?: string;
}): Promise<VideoFrameExtractionResult> {
  // 1. Primary path: Video-processing backend extraction using FFmpeg on the actual uploaded file
  if (params.file) {
    try {
      const resp = await fetch('/api/videos/extract-frames', {
        method: 'POST',
        headers: {
          'Content-Type': params.file.type || 'application/octet-stream',
          'x-file-name': params.file.name,
          ...(params.creatorId ? { 'x-creator-id': params.creatorId } : {}),
          ...(params.postId ? { 'x-post-id': params.postId } : {}),
          ...(params.videoMediaId ? { 'x-video-media-id': params.videoMediaId } : {})
        },
        body: params.file
      });

      if (resp.ok) {
        const data = await resp.json();
        if (data?.success && Array.isArray(data.frames) && data.frames.length > 0) {
          return {
            success: true,
            mediaKey: data.mediaKey,
            durationSeconds: data.durationSeconds || 10,
            width: data.width || 1280,
            height: data.height || 720,
            aspectRatio: data.aspectRatio || '16:9',
            orientation: data.orientation || 'landscape',
            frames: data.frames,
            recommendedThumbnailUrl: data.recommendedThumbnailUrl || data.frames[0].url
          };
        }
      }
    } catch {
      // fall through to browser video decoder fallback if backend upload exceeded transient limit
    }

    // Fallback: decode actual uploaded video directly in browser canvas and persist to backend storage
    return extractFramesViaBrowserCanvas({
      source: params.file,
      videoMediaId: params.videoMediaId,
      postId: params.postId,
      creatorId: params.creatorId
    });
  }

  // 2. Existing URL / Studio Asset extraction via backend FFmpeg
  if (params.sourceUrl) {
    if (!params.sourceUrl.startsWith('blob:')) {
      try {
        const resp = await fetch('/api/videos/extract-from-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sourceUrl: params.sourceUrl,
            creatorId: params.creatorId,
            postId: params.postId,
            videoMediaId: params.videoMediaId
          })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data?.success && Array.isArray(data.frames) && data.frames.length > 0) {
            return {
              success: true,
              mediaKey: data.mediaKey,
              durationSeconds: data.durationSeconds || 10,
              width: data.width || 1280,
              height: data.height || 720,
              aspectRatio: data.aspectRatio || '16:9',
              orientation: data.orientation || 'landscape',
              frames: data.frames,
              recommendedThumbnailUrl: data.recommendedThumbnailUrl || data.frames[0].url
            };
          }
        }
      } catch {
        // fall through to browser video canvas extraction
      }
    }

    // Fallback to browser decoding of the actual video URL
    const canvasRes = await extractFramesViaBrowserCanvas({
      source: params.sourceUrl,
      videoMediaId: params.videoMediaId,
      postId: params.postId,
      creatorId: params.creatorId
    });
    if (canvasRes.success) return canvasRes;

    // Last check only for built-in static /videos/sample{1..4}.mp4 which already have ffmpeg-extracted WebPs
    const localSample = getLocalSampleThumbnails(params.sourceUrl);
    if (localSample) {
      return {
        success: true,
        durationSeconds: localSample.durationSeconds,
        width: localSample.width,
        height: localSample.height,
        aspectRatio: computeAspectRatioLabel(localSample.width, localSample.height),
        orientation: localSample.width >= localSample.height ? 'landscape' : 'portrait',
        frames: localSample.frames,
        recommendedThumbnailUrl: localSample.thumbnailUrl
      };
    }

    return canvasRes;
  }

  return {
    success: false,
    durationSeconds: 0,
    width: 0,
    height: 0,
    aspectRatio: '16:9',
    orientation: 'landscape',
    frames: [],
    recommendedThumbnailUrl: '',
    error: 'No video file or stream URL provided for cover frame extraction.'
  };
}

export async function fetchStoredVideoCoverMetadata(params: {
  postId?: string;
  videoMediaId?: string;
}): Promise<{
  frames: ExtractedVideoFrame[];
  selectedThumbnailUrl?: string;
  recommendedThumbnailUrl?: string;
  autoSelected?: boolean;
  width?: number;
  height?: number;
  aspectRatio?: string;
} | null> {
  try {
    const qs = new URLSearchParams();
    if (params.postId) qs.set('postId', params.postId);
    if (params.videoMediaId) qs.set('videoMediaId', params.videoMediaId);
    if (!qs.toString()) return null;

    const resp = await fetch(`/api/videos/cover-metadata?${qs.toString()}`);
    if (!resp.ok) return null;
    const data = await resp.json();
    const rec = data?.record;
    if (!rec || !Array.isArray(rec.frames) || rec.frames.length === 0) return null;
    return {
      frames: rec.frames,
      selectedThumbnailUrl: rec.selectedThumbnailUrl,
      recommendedThumbnailUrl: rec.recommendedThumbnailUrl,
      autoSelected: rec.autoSelected,
      width: rec.width,
      height: rec.height,
      aspectRatio: rec.aspectRatio
    };
  } catch {
    return null;
  }
}

export async function persistSelectedVideoCover(params: {
  postId?: string;
  videoMediaId?: string;
  creatorId?: string;
  selectedThumbnailUrl: string;
  autoSelected?: boolean;
  previewFrames?: string[];
}): Promise<boolean> {
  try {
    const resp = await fetch('/api/videos/select-cover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return resp.ok;
  } catch {
    return false;
  }
}
