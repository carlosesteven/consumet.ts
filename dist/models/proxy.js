"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Proxy = void 0;
const axios_1 = __importDefault(require("axios"));
class Proxy {
    /**
     *
     * @param proxyConfig The proxy config (optional)
     * @param adapter The axios adapter (optional)
     */
    constructor(proxyConfig, adapter) {
        this.proxyConfig = proxyConfig;
        this.adapter = adapter;
        this.validUrl = /^https?:\/\/.+/;
        this.rotateProxy = (proxy) => {
            setInterval(() => {
                const url = proxy.urls.shift();
                if (url)
                    proxy.urls.push(url);
                this.setProxy({ url: proxy.urls[0], key: proxy.key });
            }, proxy?.rotateInterval ?? 5000);
        };
        this.toMap = (arr) => arr.map((v, i) => [i, v]);
        this.client = axios_1.default.create();
        if (proxyConfig)
            this.setProxy(proxyConfig);
        if (adapter)
            this.setAxiosAdapter(adapter);
    }
    /**
     * Set or Change the proxy config
     */
    setProxy(proxyConfig) {
        if (!proxyConfig?.url)
            return;
        if (typeof proxyConfig?.url === 'string')
            if (!this.validUrl.test(proxyConfig.url))
                throw new Error('Proxy URL is invalid!');
        if (Array.isArray(proxyConfig?.url)) {
            for (const [i, url] of this.toMap(proxyConfig.url))
                if (!this.validUrl.test(url))
                    throw new Error(`Proxy URL at index ${i} is invalid!`);
            this.rotateProxy({ ...proxyConfig, urls: proxyConfig.url });
            return;
        }
        this.client.interceptors.request.use(config => {
            if (proxyConfig?.url) {
                config.headers.set('x-api-key', proxyConfig?.key ?? '');
                config.url = `${proxyConfig.url}${config?.url ? config?.url : ''}`;
            }
            if (config?.url?.includes('anify'))
                config.headers.set('User-Agent', 'consumet');
            return config;
        });
    }
    /**
     * Set or Change the axios adapter
     */
    setAxiosAdapter(adapter) {
        this.client.defaults.adapter = adapter;
    }
}
exports.Proxy = Proxy;
exports.default = Proxy;
//# sourceMappingURL=proxy.js.map