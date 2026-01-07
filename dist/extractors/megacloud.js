"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
const megacloud_v3_1 = require("./megacloud/megacloud.v3");
class MegaCloud extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'MegaCloud';
        this.sources = [];
        this.extract = async (videoUrl) => {
            var _a, _b, _c;
            try {
                const apiUrl = 'https://crawlr.cc/9D7F1B3E8?url=' + encodeURIComponent(videoUrl.href);
                const { data } = await this.client.get(apiUrl);
                if (!data.sources || data.sources.length === 0) {
                    throw new Error('No sources returned');
                }
                for (const src of data.sources) {
                    this.sources.push({
                        url: src.url,
                        quality: (_a = src.quality) !== null && _a !== void 0 ? _a : 'auto',
                        isM3U8: src.url.includes('.m3u8'),
                    });
                }
                const subtitles = (_c = (_b = data.tracks) === null || _b === void 0 ? void 0 : _b.map(t => {
                    var _a, _b;
                    return ({
                        lang: (_a = t.label) !== null && _a !== void 0 ? _a : 'Unknown',
                        url: t.file,
                        kind: (_b = t.kind) !== null && _b !== void 0 ? _b : 'captions',
                    });
                })) !== null && _c !== void 0 ? _c : [];
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
    async extract_CSC_LAB(embedIframeURL, referer = 'https://hianime.to') {
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
                resp = await (0, megacloud_v3_1.getSourcesV3)(embedIframeURL.href, referer);
            }
            catch (e) {
                console.log('\n- Megacloud: CSC_LAB API failed, falling back to Crawlr');
                const apiUrl = 'https://crawlr.cc/9D7F1B3E8?url=' + encodeURIComponent(embedIframeURL.href);
                resp = await this.client.get(apiUrl);
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
            extractedData.subtitles = resp.tracks.map((track) => ({
                url: track.file,
                lang: track.label ? track.label : track.kind,
            }));
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