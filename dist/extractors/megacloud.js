"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const megacloud_aniwatch_1 = require("./megacloud/megacloud.aniwatch");
class MegaCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'MegaCloud';
        this.sources = [];
        this.extract = async (videoUrl) => {
            try {
                const apiUrl = 'https://crawlr.cc/9D7F1B3E8?url=' + encodeURIComponent(videoUrl.href);
                const { data } = await this.client.get(apiUrl);
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
                const subtitles = data.tracks?.map(t => ({
                    lang: t.label ?? 'Unknown',
                    url: t.file,
                    kind: t.kind ?? 'captions',
                })) ?? [];
                return {
                    sources: this.sources,
                    subtitles,
                };
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
    }
    async extract_CSC_LAB(embedIframeURL, referer = 'https://aniwatchtv.to') {
        try {
            const extractedData = {
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
            let resp = null;
            try {
                console.log('\n- Megacloud: CSC_LAB API');
                resp = await (0, megacloud_aniwatch_1.getSourcesAniwatch)(embedIframeURL.href, referer);
            }
            catch (e) {
                console.log('\n- Megacloud: CSC_LAB API failed, retrying once');
                console.log('First attempt error message:', e?.message);
                console.log('First attempt error code:', e?.code);
                console.log('First attempt full error:', e);
                resp = await (0, megacloud_aniwatch_1.getSourcesAniwatch)(embedIframeURL.href, referer);
            }
            if (!resp)
                return extractedData;
            if (Array.isArray(resp.sources)) {
                extractedData.sources = resp.sources.map((s) => ({
                    url: s.file,
                    isM3U8: s.type === 'hls',
                    type: s.type,
                }));
            }
            extractedData.intro = resp.intro ? resp.intro : extractedData.intro;
            extractedData.outro = resp.outro ? resp.outro : extractedData.outro;
            extractedData.subtitles = Array.isArray(resp.tracks)
                ? resp.tracks.map((track) => ({
                    url: track.file,
                    lang: track.label ? track.label : track.kind,
                }))
                : [];
            return {
                intro: extractedData.intro,
                outro: extractedData.outro,
                sources: extractedData.sources,
                subtitles: extractedData.subtitles,
            };
        }
        catch (err) {
            throw err;
        }
    }
}
exports.default = MegaCloud;
//# sourceMappingURL=megacloud.js.map