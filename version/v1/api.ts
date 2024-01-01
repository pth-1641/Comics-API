import express from 'express';
import axios from 'axios';
import { Comics } from '.';
import userAgent from 'random-useragent';

const allStatus = ['all', 'completed', 'ongoing'];
type Status = 'all' | 'completed' | 'ongoing';

const router = express.Router();

// Genres
router.get('/genres', async (req, res) => {
  res.json(await Comics.getGenres());
});

router.get('/genres/:slug', async (req, res, next) => {
  try {
    const { params, query } = req;
    const slug = params.slug;
    const page = query.page ? Number(query.page) : 1;
    const status = query.status ? `${query.status}` : 'all';
    if (!allStatus.includes(status)) throw Error('Invalid status');
    res.json(await Comics.getComicsByGenre(slug, page, status as Status));
  } catch (err) {
    next(err);
  }
});

// Page params
const statusPaths = [
  {
    path: '/new-comics',
    callback: (page: number, status: Status) =>
      Comics.getNewComics(page, status),
  },
  {
    path: '/recent-update-comics',
    callback: (page: number, status: Status) =>
      Comics.getRecentUpdateComics(page, status),
  },
];

statusPaths.forEach(({ path, callback }) => {
  router.get(path, async (req, res, next) => {
    try {
      const { query } = req;
      const status = query.status ? `${query.status}` : 'all';
      const page = query.page ? Number(query.page) : 1;
      if (!allStatus.includes(status)) throw Error('Invalid status');
      res.json(await callback(page, status as Status));
    } catch (err) {
      next(err);
    }
  });
});

// Recommend Comics
router.get(`/recommend-comics`, async (req, res) => {
  res.json(await Comics.getRecommendComics());
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
  router.get(path, async (req, res, next) => {
    try {
      const { query } = req;
      const q = query.q ? `${query.q}` : '';
      if (!q) throw Error('Invalid query');
      const page = query.page ? Number(query.page) : 1;
      res.json(await callback(q, page));
    } catch (err) {
      next(err);
    }
  });
});

// Page params
const pageParamsApiPaths = [
  {
    path: '/boy-comics',
    callback: (page: number) => Comics.getBoyComics(page),
  },
  {
    path: '/completed-comics',
    callback: (page: number) => Comics.getCompletedComics(page),
  },
  {
    path: '/girl-comics',
    callback: (page: number) => Comics.getGirlComics(page),
  },
  {
    path: '/trending-comics',
    callback: (page: number) => Comics.getTrendingComics(page),
  },
];

pageParamsApiPaths.forEach(({ path, callback }) => {
  router.get(path, async (req, res, next) => {
    try {
      const { query } = req;
      const page = query.page ? Number(query.page) : 1;
      res.json(await callback(page));
    } catch (err) {
      next(err);
    }
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
  router.get(path, async (req, res, next) => {
    try {
      const { params } = req;
      const slug = params.slug;
      if (!slug) throw Error('Invalid');
      res.json(await callback(slug));
    } catch (err) {
      next(err);
    }
  });
});

router.get('/comics/:slug/chapters/:chapter_id', async (req, res) => {
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
    callback: (status: Status, page: number) =>
      Comics.getTopAllComics(status, page),
  },
  {
    path: '/weekly',
    callback: (status: Status, page: number) =>
      Comics.getTopWeeklyComics(status, page),
  },
  {
    path: '/monthly',
    callback: (status: Status, page: number) =>
      Comics.getTopMonthlyComics(status, page),
  },
  {
    path: '/daily',
    callback: (status: Status, page: number) =>
      Comics.getTopDailyComics(status, page),
  },
  {
    path: '/chapter',
    callback: (status: Status, page: number) =>
      Comics.getTopChapterComics(status, page),
  },
  {
    path: '/follow',
    callback: (status: Status, page: number) =>
      Comics.getTopFollowComics(status, page),
  },
  {
    path: '/comment',
    callback: (status: Status, page: number) =>
      Comics.getTopCommentComics(status, page),
  },
];

topComicsApiPaths.forEach(({ path, callback }) => {
  router.get(`/top${path}`, async (req, res) => {
    const { query } = req;
    const status = query.status ? query.status : 'all';
    const page = query.page ? Number(query.page) : 1;
    res.json(await callback(status as Status, page));
  });
});

router.get('/images', async (req, res, next) => {
  try {
    const src = req.query.src;
    if (!src) throw new Error('Invalid image source');
    const providers = ['nettruyennew.com', 'truyenqq.com.vn', 'nettruyenco.vn'];
    const response = await axios.get(`${src}`, {
      responseType: 'stream',
      headers: {
        referer: `https://${providers[Math.floor(Math.random() * 3)]}`,
        'User-Agent': userAgent.getRandom(),
      },
    });
    response.data.pipe(res);
  } catch (err) {
    next(err);
  }
});

export default router;
