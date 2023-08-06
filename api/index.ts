import axios from 'axios';
import { Comics } from '..';
import { userAgents, UALength } from '../user-agent';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(require('cors')());

const allStatus = ['all', 'completed', 'ongoing'];

// Genres
app.get('/genres', async (req, res) => {
  res.json(await Comics.getGenres('full'));
});

app.get('/genres/:slug', async (req, res) => {
  const { params, query } = req;
  const slug = params.slug;
  const page = query.page ? Number(query.page) : 1;
  const status = query.status ? query.status : 'all';
  //@ts-ignore
  if (!allStatus.includes(status)) throw Error('Invalid status');
  //@ts-ignore
  res.json(await Comics.getComicsByGenre(slug, page, status));
});

// New Comics
app.get(`/new-comics`, async (req, res) => {
  const { query } = req;
  const status = query.status ? query.status : 'all';
  const page = query.page ? Number(query.page) : 1;
  //@ts-ignore
  if (!allStatus.includes(status)) throw Error('Invalid status');
  // @ts-ignore
  res.json(await Comics.getNewComics(page));
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
    res.json(await callback(q, page));
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
    const providers = ['nettruyennew.com', 'truyenqq.com.vn', 'nettruyenco.vn'];
    const response = await axios.get(src, {
      responseType: 'stream',
      headers: {
        referer: `https://${providers[Math.floor(Math.random() * 3)]}`,
        'User-Agent': userAgents[Math.random() * UALength],
      },
    });
    response.data.pipe(res);
  } catch (err) {
    throw err;
  }
});

app.get('/', (req, res) => {
  res.json({
    Github: 'https://github.com/pth-1641/Comics-API',
    Issues: 'https://github.com/pth-1641/Comics-API/issues'
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
