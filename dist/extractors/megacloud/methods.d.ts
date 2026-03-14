export declare const SRC_BASE_URL: string;
export declare function getMegaCloudClientKey(xrax: string): Promise<string | null>;
export declare function decryptSrc2(src: string, clientKey: string, megacloudKey: string): string;
