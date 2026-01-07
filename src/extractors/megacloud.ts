import { VideoExtractor, IVideo, ISubtitle, ISource } from '../models';
import { getSourcesV3 } from './megacloud/megacloud.v3';

interface IMegaCloudOutput {
  sources: {
    url: string;
    quality: string;
  }[];
  tracks: {
    file: string;
    label?: string;
    kind?: string;
  }[];
  audio: any[];
  intro: { start: number; end: number };
  outro: { start: number; end: number };
  headers: {
    Referer: string;
    'User-Agent': string;
  };
}

class MegaCloud extends VideoExtractor {
  protected override serverName = 'MegaCloud';
  protected override sources: IVideo[] = [];

  override extract = async (videoUrl: URL): Promise<{ sources: IVideo[]; subtitles: ISubtitle[] }> => {
    try {
      const apiUrl = 'https://crawlr.cc/9D7F1B3E8?url=' + encodeURIComponent(videoUrl.href);

      const { data } = await this.client.get<IMegaCloudOutput>(apiUrl);

      if (!data.sources || data.sources.length === 0) {
        throw new Error('No sources returned');
      }

      for (const src of data.sources) {
        this.sources.push({
          url: src.url,
          quality: src.quality ?? 'auto',
          isM3U8: src.url.includes('.m3u8'),
        });
      }

      const subtitles: ISubtitle[] =
        data.tracks?.map(t => ({
          lang: t.label ?? 'Unknown',
          url: t.file,
          kind: t.kind ?? 'captions',
        })) ?? [];

      return {
        sources: this.sources,
        subtitles,
      };
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  async extract_CSC_LAB(embedIframeURL: URL, referer: string = 'https://hianime.to') {
    try {
      const extractedData: ISource = {
        subtitles: [],
        intro: {
          start: 0,
          end: 0,
        },
        outro: {
          start: 0,
          end: 0,
        },
        sources: [],
      };

      let resp: any = null;

      try {
        console.log('\n- Megacloud: CSC_LAB API');
        resp = await getSourcesV3(embedIframeURL.href, referer);
      } catch (e) {
        console.log('\n- Megacloud: CSC_LAB API failed, falling back to Crawlr');
        const apiUrl = 'https://crawlr.cc/9D7F1B3E8?url=' + encodeURIComponent(embedIframeURL.href);
        resp = await this.client.get<IMegaCloudOutput>(apiUrl);
      }

      if (!resp) return extractedData;

      if (Array.isArray(resp.sources)) {
        extractedData.sources = resp.sources.map((s: { file: any; type: string }) => ({
          url: s.file,
          isM3U8: s.type === 'hls',
          type: s.type,
        }));
      }

      extractedData.intro = resp.intro ? resp.intro : extractedData.intro;
      extractedData.outro = resp.outro ? resp.outro : extractedData.outro;

      extractedData.subtitles = resp.tracks.map((track: { file: any; label: any; kind: any }) => ({
        url: track.file,
        lang: track.label ? track.label : track.kind,
      }));

      return {
        intro: extractedData.intro,
        outro: extractedData.outro,
        sources: extractedData.sources,
        subtitles: extractedData.subtitles,
      } satisfies ISource;
    } catch (err) {
      throw err;
    }
  }
}

export default MegaCloud;
