"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const models_1 = require("../models");
class VideoStr extends models_1.VideoExtractor {
    constructor() {
        super(...arguments);
        this.serverName = 'VideoStr';
        this.sources = [];
        this.extract = async (videoUrl) => {
            try {
                const apiUrl = 'https://crawlr.cc/E2B9A6F4C?url=' + encodeURIComponent(videoUrl.href);
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
}
exports.default = VideoStr;
//# sourceMappingURL=videostr.js.map