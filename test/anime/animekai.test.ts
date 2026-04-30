import { ANIME } from '../../src/providers';

jest.setTimeout(120000);

const animekai = new ANIME.AnimeKai();

test('Search: returns a filled array of anime list', async () => {
  const data = await animekai.search('Dandadan');
  expect(data.results).not.toEqual([]);
});

test('fetchLatestCompleted: returns a filled array of anime list', async () => {
  const data = await animekai.fetchLatestCompleted();
  expect(data.results).not.toEqual([]);
});

test('fetchRecentlyAdded: returns a filled array of anime list', async () => {
  const data = await animekai.fetchRecentlyAdded();
  expect(data.results).not.toEqual([]);
});

test('FetchNewReleases: returns a filled array of anime list', async () => {
  const data = await animekai.fetchNewReleases();
  expect(data.results).not.toEqual([]);
});

test('fetchMovie: returns a filled array of anime list', async () => {
  const data = await animekai.fetchMovie();
  expect(data.results).not.toEqual([]);
});

test('fetchTV: returns a filled array of anime list', async () => {
  const data = await animekai.fetchTV();
  expect(data.results).not.toEqual([]);
});

test('fetchOVA: returns a filled array of anime list', async () => {
  const data = await animekai.fetchOVA();
  expect(data.results).not.toEqual([]);
});

test('fetchONA: returns a filled array of anime list', async () => {
  const data = await animekai.fetchONA();
  expect(data.results).not.toEqual([]);
});

test('fetchSpecial: returns a filled array of anime list', async () => {
  const data = await animekai.fetchSpecial();
  expect(data.results).not.toEqual([]);
});

test('fetchGenres: returns a filled array of genres', async () => {
  const data = await animekai.fetchGenres();
  expect(data).not.toEqual([]);
});

test('genreSearch: returns a filled array of anime list', async () => {
  const data = await animekai.genreSearch('action');
  expect(data.results).not.toEqual([]);
});

test('fetchSchedule: returns a filled array of anime list', async () => {
  const data = await animekai.fetchSchedule();
  expect(data.results).not.toEqual([]);
});

test('fetchSpotlight: returns a filled array of anime list', async () => {
  const data = await animekai.fetchSpotlight();
  expect(data.results).not.toEqual([]);
});

test('fetchSearchSuggestions: returns a filled array of anime list', async () => {
  const data = await animekai.fetchSearchSuggestions('jar');
  expect(data.results).not.toEqual([]);
});

test('fetchEpisodeSources: returns valid streaming sources from API', async () => {
  const search = await animekai.search('Naruto');
  expect(search.results.length).toBeGreaterThan(0);

  const anime = search.results[0];

  const info = await animekai.fetchAnimeInfo(anime.id);

  console.log('Info:', info);

  expect(info.episodes?.length).toBeGreaterThan(0);

  const episode = info.episodes![0];

  const sources = await animekai.fetchEpisodeSources(episode.id);

  expect(sources).toBeDefined();
  expect(sources.sources).toBeDefined();
  expect(sources.sources.length).toBeGreaterThan(0);

  expect(sources.sources[0].url).toContain('m3u8');

  expect(sources.headers).toBeDefined();
  expect(sources.headers?.Referer).toBeDefined();

  console.log('Sources:', sources);
});
