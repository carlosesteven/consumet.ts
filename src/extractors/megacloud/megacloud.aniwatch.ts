import axios from 'axios';
import { getMegaCloudClientKey, decryptSrc2 } from './methods';

export async function getSourcesAniwatch(embed_url: string, site: string) {
  try {
    const response = await axios.get(
      'https://raw.githubusercontent.com/yogesh-hacker/MegacloudKeys/refs/heads/main/keys.json'
    );

    const key = response.data;
    const megacloudKey = key['mega'];

    const match = /\/([^\/\?]+)\?/.exec(embed_url);
    const sourceId = match?.[1];

    if (!sourceId) {
      throw new Error('Unable to extract sourceId from embed URL');
    }

    const clientKey = await getMegaCloudClientKey(sourceId);
    if (!clientKey) {
      throw new Error('Unable to extract client key from iframe');
    }

    const megacloudUrl = `https://megacloud.blog/embed-2/v3/e-1/getSources?id=${sourceId}&_k=${clientKey}`;

    const { data: rawSourceData } = await axios.get(megacloudUrl, { timeout: 5000 });

    let decryptedSources;

    if (!rawSourceData?.encrypted) {
      decryptedSources = rawSourceData?.sources;
    } else {
      const encrypted = rawSourceData?.sources;

      if (!encrypted) {
        throw new Error('Encrypted source missing in response');
      }

      const decrypted = decryptSrc2(encrypted, clientKey, megacloudKey);

      try {
        decryptedSources = JSON.parse(decrypted);
      } catch {
        throw new Error('Decrypted data is not valid JSON');
      }
    }

    return {
      intro: rawSourceData.intro
        ? {
            start: rawSourceData.intro.start ?? rawSourceData.intro[0] ?? 0,
            end: rawSourceData.intro.end ?? rawSourceData.intro[1] ?? 0,
          }
        : { start: 0, end: 0 },

      outro: rawSourceData.outro
        ? {
            start: rawSourceData.outro.start ?? rawSourceData.outro[0] ?? 0,
            end: rawSourceData.outro.end ?? rawSourceData.outro[1] ?? 0,
          }
        : { start: 0, end: 0 },

      sources: Array.isArray(decryptedSources)
        ? decryptedSources.map((s: any) => ({
            file: s.file,
            type: s.type,
          }))
        : [],

      tracks: Array.isArray(rawSourceData.tracks)
        ? rawSourceData.tracks.map((track: any) => ({
            file: track.file,
            label: track.label,
            kind: track.kind,
            default: track.default ?? false,
          }))
        : [],
    };
  } catch (err) {
    throw err;
  }
}
