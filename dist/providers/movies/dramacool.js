"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cheerio_1 = require("cheerio");
const extractors_1 = require("../../extractors");
const models_1 = require("../../models");
class DramaCool extends models_1.MovieParser {
    constructor() {
        super(...arguments);
        this.name = 'DramaCool';
        this.baseUrl = 'https://dramacool.bg';
        this.logo = 'https://play-lh.googleusercontent.com/IaCb2JXII0OV611MQ-wSA8v_SAs9XF6E3TMDiuxGGXo4wp9bI60GtDASIqdERSTO5XU';
        this.classPath = 'MOVIES.DramaCool';
        this.supportedTypes = new Set([models_1.TvType.MOVIE, models_1.TvType.TVSERIES]);
        this.search = async (query, page = 1) => {
            try {
                const searchResult = {
                    currentPage: page,
                    totalPages: page,
                    hasNextPage: false,
                    results: [],
                };
                const { data } = await this.client.get(`${this.baseUrl}/search?type=drama&keyword=${query.replace(/[\W_]+/g, '+')}&page=${page}`);
                const $ = (0, cheerio_1.load)(data);
                const navSelector = 'ul.pagination';
                searchResult.hasNextPage =
                    $(navSelector).length > 0 ? !$(navSelector).children().last().hasClass('selected') : false;
                const lastPage = $(navSelector).children().last().find('a').attr('href');
                if (lastPage != undefined && lastPage != '' && lastPage.includes('page=')) {
                    const maxPage = new URLSearchParams(lastPage).get('page');
                    if (maxPage != null && !isNaN(parseInt(maxPage)))
                        searchResult.totalPages = parseInt(maxPage);
                    else if (searchResult.hasNextPage)
                        searchResult.totalPages = page + 1;
                }
                else if (searchResult.hasNextPage)
                    searchResult.totalPages = page + 1;
                $('div.block > div.tab-content > ul.list-episode-item > li').each((i, el) => {
                    var _a;
                    searchResult.results.push({
                        id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.split(`${this.baseUrl}/`)[1],
                        title: $(el).find('a > h3').text(),
                        url: `${$(el).find('a').attr('href')}`,
                        image: $(el).find('a > img').attr('data-original'),
                    });
                });
                return searchResult;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchMediaInfo = async (mediaId) => {
            var _a;
            try {
                const realMediaId = mediaId;
                if (!mediaId.startsWith(this.baseUrl))
                    mediaId = `${this.baseUrl}/${mediaId}`;
                const mediaInfo = {
                    id: '',
                    title: '',
                };
                const { data } = await this.client.get(mediaId);
                const $ = (0, cheerio_1.load)(data);
                mediaInfo.id = realMediaId;
                const duration = $('div.details div.info p:contains("Duration:")').first().text().trim();
                if (duration != '')
                    mediaInfo.duration = duration.replace('Duration:', '').trim();
                const status = $('div.details div.info p:contains("Status:")').find('a').first().text().trim();
                switch (status) {
                    case 'Ongoing':
                        mediaInfo.status = models_1.MediaStatus.ONGOING;
                        break;
                    case 'Completed':
                        mediaInfo.status = models_1.MediaStatus.COMPLETED;
                        break;
                    default:
                        mediaInfo.status = models_1.MediaStatus.UNKNOWN;
                        break;
                }
                mediaInfo.genres = [];
                const genres = $('div.details div.info p:contains("Genre:")');
                genres.each((_index, element) => {
                    $(element)
                        .find('a')
                        .each((_, anchorElement) => {
                        var _a;
                        (_a = mediaInfo.genres) === null || _a === void 0 ? void 0 : _a.push($(anchorElement).text());
                    });
                });
                mediaInfo.title = $('.info > h1:nth-child(1)').text();
                mediaInfo.otherNames = $('.other_name > a')
                    .map((i, el) => $(el).text().trim())
                    .get();
                mediaInfo.image = $('div.details > div.img > img').attr('src');
                mediaInfo.description = $('div.details div.info p:not(:has(*))')
                    .map((i, el) => $(el).text().trim())
                    .get()
                    .join('\n\n')
                    .trim();
                mediaInfo.releaseDate = this.removeContainsFromString($('div.details div.info p:contains("Released:")').text(), 'Released');
                mediaInfo.contentRating = this.removeContainsFromString($('div.details div.info p:contains("Content Rating:")').text(), 'Content Rating');
                mediaInfo.airsOn = this.removeContainsFromString($('div.details div.info p:contains("Airs On:")').text(), 'Airs On');
                mediaInfo.director = this.removeContainsFromString($('div.details div.info p:contains("Director:")').text(), 'Director');
                mediaInfo.originalNetwork = this.cleanUpText(this.removeContainsFromString($('div.details div.info p:contains("Original Network:")').text().trim(), 'Original Network'));
                const trailerIframe = $('div.trailer').find('iframe').attr('src');
                mediaInfo.trailer = {
                    id: (_a = trailerIframe === null || trailerIframe === void 0 ? void 0 : trailerIframe.split('embed/')[1]) === null || _a === void 0 ? void 0 : _a.split('?')[0],
                    url: trailerIframe,
                };
                mediaInfo.characters = [];
                $('div.slider-star > div.item').each((i, el) => {
                    const url = `${this.baseUrl}${$(el).find('a.img').attr('href')}`;
                    const image = $(el).find('img').attr('src');
                    const name = $(el).find('h3.title').text().trim();
                    mediaInfo.characters.push({
                        url,
                        image,
                        name,
                    });
                });
                mediaInfo.episodes = [];
                $('div.content-left > div.block-tab > div > div > ul > li').each((i, el) => {
                    var _a, _b, _c;
                    (_a = mediaInfo.episodes) === null || _a === void 0 ? void 0 : _a.push({
                        id: (_b = $(el).find('a').attr('href')) === null || _b === void 0 ? void 0 : _b.split(`${this.baseUrl}/`)[1],
                        title: $(el).find('h3').text().replace(mediaInfo.title.toString(), '').trim(),
                        episode: parseFloat((_c = $(el).find('a').attr('href')) === null || _c === void 0 ? void 0 : _c.split('-episode-')[1]),
                        subType: $(el).find('span.type').text(),
                        releaseDate: $(el).find('span.time').text(),
                        url: `${$(el).find('a').attr('href')}`,
                    });
                });
                mediaInfo.episodes.reverse();
                return mediaInfo;
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchEpisodeSources = async (episodeId, server = models_1.StreamingServers.AsianLoad) => {
            if (episodeId.startsWith('http')) {
                const serverUrl = new URL(episodeId);
                switch (server) {
                    case models_1.StreamingServers.AsianLoad:
                        return {
                            headers: { Referer: serverUrl.origin },
                            ...(await new extractors_1.AsianLoad(this.proxyConfig, this.adapter).extract(serverUrl)),
                            download: this.downloadLink(episodeId),
                        };
                    case models_1.StreamingServers.MixDrop:
                        return {
                            headers: { Referer: serverUrl.origin },
                            sources: await new extractors_1.MixDrop(this.proxyConfig, this.adapter).extract(serverUrl),
                        };
                    case models_1.StreamingServers.StreamTape:
                        return {
                            headers: { Referer: serverUrl.origin },
                            sources: await new extractors_1.StreamTape(this.proxyConfig, this.adapter).extract(serverUrl),
                        };
                    case models_1.StreamingServers.StreamSB:
                        return {
                            headers: { Referer: serverUrl.origin },
                            sources: await new extractors_1.StreamSB(this.proxyConfig, this.adapter).extract(serverUrl),
                        };
                    case models_1.StreamingServers.StreamWish:
                        return {
                            headers: { Referer: serverUrl.origin },
                            ...(await new extractors_1.StreamWish(this.proxyConfig, this.adapter).extract(serverUrl)),
                        };
                    case models_1.StreamingServers.VidHide:
                        return {
                            headers: { Referer: serverUrl.href },
                            sources: await new extractors_1.VidHide(this.proxyConfig, this.adapter).extract(serverUrl),
                        };
                    default:
                        throw new Error('Server not supported');
                }
            }
            try {
                // episodeId = `${this.baseUrl}/${episodeId}`;
                const servers = await this.fetchEpisodeServers(episodeId);
                const i = servers.findIndex(s => s.name.toLowerCase() === server.toLowerCase());
                if (i === -1) {
                    throw new Error(`Server ${server} not found`);
                }
                const serverUrl = new URL(servers.filter(s => s.name.toLowerCase() === server.toLowerCase())[0].url);
                return await this.fetchEpisodeSources(serverUrl.href, server);
            }
            catch (err) {
                throw new Error(err.message);
            }
        };
        this.fetchPopular = async (page = 1) => {
            return this.fetchData(`${this.baseUrl}/all-most-popular-drama?page=${page}`, page);
        };
        this.fetchRecentTvShows = async (page = 1) => {
            return this.fetchData(`${this.baseUrl}/all-recently-added/drama?page=${page}`, page, true);
        };
        this.fetchRecentMovies = async (page = 1) => {
            return this.fetchData(`${this.baseUrl}/all-recently-added/movie?page=${page}`, page, false, true);
        };
        this.fetchSpotlight = async () => {
            try {
                const results = { results: [] };
                const { data } = await this.client.get(`${this.baseUrl}`);
                const $ = (0, cheerio_1.load)(data);
                $('div.ls-slide').each((i, el) => {
                    var _a;
                    results.results.push({
                        id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.slice(1),
                        title: $(el).find('img').attr('title'),
                        url: `${this.baseUrl}${$(el).find('a').attr('href')}`,
                        cover: $(el).find('img').attr('src'),
                    });
                });
                return results;
            }
            catch (err) {
                console.error(err);
                throw new Error(err.message);
            }
        };
        this.downloadLink = (url) => {
            return url.replace(/^(https:\/\/[^\/]+)\/[^?]+(\?.+)$/, '$1/download$2');
        };
        this.removeContainsFromString = (str, contains) => {
            contains = contains.toLowerCase();
            return str.toLowerCase().replace(/\n/g, '').replace(`${contains}:`, '').trim();
        };
        this.cleanUpText = (str) => {
            return str
                .split(';')
                .map(part => part.trim())
                .filter(part => part.length > 0)
                .join('; ');
        };
    }
    async fetchEpisodeServers(episodeId, ...args) {
        try {
            const episodeServers = [];
            episodeId = `${this.baseUrl}/${episodeId}`;
            const { data } = await this.client.get(episodeId);
            const $ = (0, cheerio_1.load)(data);
            // keeping the old code future reference
            // $('div.anime_muti_link > ul > li').map(async (i, ele) => {
            //   const url = $(ele).attr('data-video')!;
            //   let name = $(ele).attr('class')!.replace('selected', '').trim();
            //   if (name.includes('standard')) {
            //     name = StreamingServers.AsianLoad;
            //   }
            //   episodeServers.push({
            //     name: name,
            //     url: url.startsWith('//') ? url?.replace('//', 'https://') : url,
            //   });
            // });
            const standardServer = $('div.anime_muti_link > ul > li.standard').attr('data-video');
            const url = standardServer.startsWith('//')
                ? standardServer === null || standardServer === void 0 ? void 0 : standardServer.replace('//', 'https://')
                : standardServer;
            const { data: servers } = await this.client.get(url);
            const $$ = (0, cheerio_1.load)(servers);
            $$('div#list-server-more > ul > li').each((i, el) => {
                let name = $$(el).attr('data-provider');
                const server = $$(el).attr('data-video');
                if (name.includes('serverwithtoken')) {
                    name = models_1.StreamingServers.AsianLoad;
                }
                if (server) {
                    episodeServers.push({
                        name: name,
                        url: server.startsWith('//') ? server === null || server === void 0 ? void 0 : server.replace('//', 'https://') : server,
                    });
                }
            });
            return episodeServers;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
    async fetchData(url, page, isTvShow = false, isMovies = false) {
        try {
            const { data } = await this.client.get(url);
            const $ = (0, cheerio_1.load)(data);
            const results = {
                currentPage: page,
                totalPages: page,
                hasNextPage: false,
                results: [],
            };
            $('ul.switch-block.list-episode-item')
                .find('li')
                .each((i, el) => {
                var _a;
                const result = {
                    id: (_a = $(el).find('a').attr('href')) === null || _a === void 0 ? void 0 : _a.split(`${this.baseUrl}/`)[1],
                    title: $(el).find('h3.title').text().trim(),
                    url: `${$(el).find('a').attr('href')}`,
                    image: $(el).find('img').attr('data-original'),
                };
                // keeping the old code for future reference
                // if (isTvShow || isMovies) {
                //   result.id = result.image
                //     ? result.image.replace(/^https:\/\/[^\/]+\/[^\/]+\/(.+?)-\d+\.\w+$/, 'drama-detail/$1')!
                //     : '';
                // }
                if (isTvShow) {
                    result.episodeNumber = parseFloat($(el).find('span.ep').text().trim().split(' ')[1]);
                }
                results.results.push(result);
            });
            const navSelector = 'ul.pagination';
            results.hasNextPage =
                $(navSelector).length > 0 ? !$(navSelector).children().last().hasClass('selected') : false;
            const lastPage = $(navSelector).children().last().find('a').attr('href');
            if (lastPage != undefined && lastPage != '' && lastPage.includes('page=')) {
                const maxPage = new URLSearchParams(lastPage).get('page');
                if (maxPage != null && !isNaN(parseInt(maxPage)))
                    results.totalPages = parseInt(maxPage);
                else if (results.hasNextPage)
                    results.totalPages = page + 1;
            }
            else if (results.hasNextPage)
                results.totalPages = page + 1;
            return results;
        }
        catch (err) {
            throw new Error(err.message);
        }
    }
}
// (async () => {
//   const dramaCool = new DramaCool();
//   // const l=await dramaCool.search('squid game');
//   const m = await dramaCool.fetchEpisodeServers('video-watch/squid-games-2021-episode-9-as-jao');
//   const l = await dramaCool.fetchEpisodeSources('video-watch/squid-games-2021-episode-9-as-jao');
//   // const l = await dramaCool.fetchMediaInfo('drama-detail/squid-games-2021-hd');
//   console.log(m,l);
// })();
exports.default = DramaCool;
//# sourceMappingURL=dramacool.js.map