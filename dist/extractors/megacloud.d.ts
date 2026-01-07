import { VideoExtractor, IVideo, ISubtitle, ISource } from '../models';
declare class MegaCloud extends VideoExtractor {
    protected serverName: string;
    protected sources: IVideo[];
    extract: (videoUrl: URL) => Promise<{
        sources: IVideo[];
        subtitles: ISubtitle[];
    }>;
    extract_CSC_LAB(embedIframeURL: URL, referer?: string): Promise<ISource>;
}
export default MegaCloud;
