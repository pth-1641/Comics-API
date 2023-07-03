import express from 'express';
import cors from 'cors';
import { Comics } from '..';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());

const allStatus = ['all', 'completed', 'updating'];
const allOrder = ['default', 'newest'];

// Genres
app.get('/genres', async (req, res) => {
  res.send(await Comics.getGenres());
});

app.get('/genres/:slug', async (req, res) => {
  const { params, query } = req;
  const slug = params.slug;
  const page = query.page ? Number(query.page) : 1;
  const status = query.status ? query.status : 'all';
  //@ts-ignore
  if (status.includes(allStatus)) throw Error('Invalid status');
  //@ts-ignore
  res.send(await Comics.getComicsByGenre(slug, page, status));
});

// New Comics
app.get(`/new-comics`, async (req, res) => {
  const { query } = req;
  const status = query.status ? query.status : 'all';
  const page = query.page ? Number(query.page) : 1;
  //@ts-ignore
  if (status.includes(allStatus)) throw Error('Invalid status');
  // @ts-ignore
  res.json(await Comics.getNewComics(status, page));
});

// Recommend Comics
app.get(`/recommend-comics`, async (req, res) => {
  const { query } = req;
  const type = query.type ? query.type : 'hot';
  // @ts-ignore
  res.json(await Comics.getRecommendComics(type));
});

// Search
app.get('/search', async (req, res) => {
  const { query } = req;
  const q = query.q ? query.q : '';
  if (!q) throw Error('Invalid query');
  const page = query.page ? Number(query.page) : 1;
  //@ts-ignore
  res.send(await Comics.searchComics(q, page));
});

// Page params
const pageParamsApiPaths = [
  {
    path: '/boy-comics',
    callback: (...params: any) => Comics.getBoyComics(...params),
  },
  {
    path: '/completed-comics',
    callback: (...params: any) => Comics.getCompletedComics(...params),
  },
  {
    path: '/girl-comics',
    callback: (...params: any) => Comics.getGirlComics(...params),
  },
  {
    path: '/recent-update-comics',
    callback: (...params: any) => Comics.getRecentUpdateComics(...params),
  },
  {
    path: '/trending',
    callback: (...params: any) => Comics.getTrending(...params),
  },
];

pageParamsApiPaths.forEach(({ path, callback }) => {
  app.get(path, async (req, res) => {
    const { query } = req;
    const page = query.page ? Number(query.page) : 1;
    res.json(await callback(page));
  });
});

// Comics
const comicIdParamsApiPaths = [
  {
    path: '/comics/:slug/chapters',
    callback: (params: string) => Comics.getChapters(params),
  },
  {
    path: '/comics/:slug',
    callback: (params: string) => Comics.getComicDetail(params),
  },
  {
    path: '/comics/authors/:slug',
    callback: (params: string) => Comics.getComicsByAuthor(params),
  },
];

comicIdParamsApiPaths.forEach(({ path, callback }) => {
  app.get(path, async (req, res) => {
    const { params } = req;
    const slug = params.slug;
    if (!slug) throw Error('Invalid');
    res.json(await callback(slug));
  });
});

app.get('/comics/:slug/images', async (req, res) => {
  const { params, query } = req;
  const slug = params.slug;
  const chapter_id = query.chapter_id ? Number(query.chapter_id) : null;
  if (!slug || !chapter_id) throw Error('Invalid');
  res.json(await Comics.getImages(slug, chapter_id));
});

app.get('/comics/:slug/comments', async (req, res) => {
  const { params, query } = req;
  const slug = params.slug;
  const page = query.page ? Number(query.page) : 1;
  const sortBy = query.sortBy ? query.sortBy : 'default';
  // @ts-ignore
  if (!sortBy.includes(allOrder)) throw Error('Invalid status');
  if (!slug) throw Error('Invalid Comic ID');
  res.json(await Comics.getComments(slug, page));
});

// Top Comics
const topComicsApiPaths = [
  {
    path: '/',
    callback: (...params: any) => Comics.getTopAllComics(...params),
  },
  {
    path: '/weekly',
    callback: (...params: any) => Comics.getTopWeeklyComics(...params),
  },
  {
    path: '/monthly',
    callback: (...params: any) => Comics.getTopMonthlyComics(...params),
  },
  {
    path: '/daily',
    callback: (...params: any) => Comics.getTopDailyComics(...params),
  },
  {
    path: '/chapter',
    callback: (...params: any) => Comics.getTopChapterComics(...params),
  },
  {
    path: '/follow',
    callback: (...params: any) => Comics.getTopFollowComics(...params),
  },
  {
    path: '/comment',
    callback: (...params: any) => Comics.getTopCommentComics(...params),
  },
];

topComicsApiPaths.forEach(({ path, callback }) => {
  app.get(`/top${path}`, async (req, res) => {
    const { query } = req;
    const status = query.status ? query.status : 'all';
    // @ts-ignore
    const page = query.page ? Number(query.page) : 1;
    res.json(await callback(status, page));
  });
});

app.get('/', (req, res) => {
  res.json({
    NPM: 'https://www.npmjs.com/package/comics-api',
    Github: 'https://github.com/pth-1641/Comics-API',
    Client: 'https://github.com/pth-1641/Comics-API/tree/master/api',
  });
});

// Handle 404
app.use((req, res) => {
  res.json({
    status: 404,
    message: 'Not Found',
  });
});

app.listen(PORT);
