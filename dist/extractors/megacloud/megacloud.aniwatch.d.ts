export declare function getSourcesAniwatch(embed_url: string, site: string): Promise<{
    intro: {
        start: any;
        end: any;
    };
    outro: {
        start: any;
        end: any;
    };
    sources: {
        file: any;
        type: any;
    }[];
    tracks: any;
}>;
