import express from 'express';
import axios from 'axios';
import { Comics } from '..';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(require('cors')());

const allStatus = ['all', 'completed', 'updating'];

// middleware
app.use((req, res, next) => {
  const hostname = req.headers['x-forwarded-host'];
  if (hostname === process.env.HOST) {
    next();
  } else {
    res.json({ status: 403, message: 'Unauthorized' });
  }
});

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
  if (!allStatus.includes(status)) throw Error('Invalid status');
  //@ts-ignore
  res.send(await Comics.getComicsByGenre(slug, page, status));
});

// New Comics
app.get(`/new-comics`, async (req, res) => {
  const { query } = req;
  const status = query.status ? query.status : 'all';
  const page = query.page ? Number(query.page) : 1;
  //@ts-ignore
  if (!allStatus.includes(status)) throw Error('Invalid status');
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
const searchApiPaths = [
  {
    path: '/search',
    callback: (q: string, page: number) => Comics.searchComics(q, page),
  },
  {
    path: '/search-suggest',
    callback: (q: string) => Comics.getSearchSuggest(q),
  },
];

searchApiPaths.forEach(({ path, callback }) => {
  app.get(path, async (req, res) => {
    const { query } = req;
    const q = query.q ? query.q : '';
    if (!q) throw Error('Invalid query');
    const page = query.page ? Number(query.page) : 1;
    //@ts-ignore
    res.send(await callback(q, page));
  });
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
    path: '/trending-comics',
    callback: (...params: any) => Comics.getTrendingComics(...params),
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

app.get('/comics/:slug/chapters/:chapter_id', async (req, res) => {
  const { params } = req;
  const slug = params.slug;
  const chapter_id = params.chapter_id ? Number(params.chapter_id) : null;
  if (!slug || !chapter_id) throw Error('Invalid');
  res.json(await Comics.getChapter(slug, chapter_id));
});

app.get('/comics/:slug/comments', async (req, res) => {
  const { params, query } = req;
  const slug = params.slug;
  const page = query.page ? Number(query.page) : 1;
  const chapter = query.chapter ? Number(query.chapter) : -1;
  // @ts-ignore
  if (!slug) throw Error('Invalid Comic ID');
  res.json(await Comics.getComments(slug, page, chapter));
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

app.get('/images', async (req: any, res: any) => {
  try {
    const { src } = req.query;
    const response = await axios.get(src, {
      responseType: 'stream',
      headers: {
        referer: 'https://www.nettruyen.com',
      },
    });
    response.data.pipe(res);
  } catch (err) {
    throw err;
  }
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
