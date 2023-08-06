import { load } from 'cheerio';
import axios from 'axios';
import dotenv from 'dotenv';
import https from 'https';
import { userAgents, UALength } from './user-agent';

dotenv.config();
const agent = new https.Agent({
  rejectUnauthorized: false,
});

type Status = 'all' | 'completed' | 'ongoing';
class ComicsApi {
  private agent: string;
  private hosts: string[];

  constructor() {
    this.hosts = process.env.HOSTS?.split(' | ') as string[];
    this.agent = userAgents[Math.floor(Math.random() * UALength)];
  }

  private async createRequest(path: string, host: 1 | 2 | 3 = 2): Promise<any> {
    try {
      const { data } = await axios.request({
        method: 'GET',
        url: `https://${this.hosts[host - 1]}/${path}`.replace(/\?+/g, '?'),
        headers: {
          'User-Agent': this.agent,
        },
        httpsAgent: agent,
      });
      return load(data);
    } catch (err) {
      throw err;
    }
  }

  private getId(link?: string): string | undefined {
    if (!link) return '';
    return link?.match(/\/([^/]+?)(?:-\d+)?$/)?.[1];
  }

  private formatTotal(total: string): number | string {
    if (!total) return 0;
    return total === 'N/A' ? 'Updating' : Number(total?.replace(/\./g, ''));
  }

  private trim(text: string): string | undefined {
    return text?.replace(/\n|\t/g, '').trim();
  }

  private async getComics(
    path: string,
    page: number = 1,
    statusKey: Status = 'all'
  ): Promise<any> {
    const status: any = {
      all: -1,
      updating: 1,
      completed: 2,
    };
    try {
      const [$, allGenres] = await Promise.all([
        this.createRequest(
          `${path + (path.includes('?') ? '&' : '?')}status=${
            status[statusKey]
          }&page=${page}`
        ),
        this.getGenres(),
      ]);
      const total_pages =
        $('.pagination li:nth-last-child(2) a')
          .attr('href')
          ?.split('=')
          .at(-1) ||
        $('.pagination .active').text() ||
        1;
      if (page > total_pages) {
        return { status: 404, message: 'Page not found' };
      }
      const comics: any = Array.from($('#main_homepage .list_grid li')).map(
        (item) => {
          const thumbnail = $('.book_avatar img', item).attr('src');
          const title = $('.book_avatar img', item).attr('alt');
          const id = this.getId($('a', item).attr('href'));
          const is_trending = !!$('.hot', item).toString();
          const updated_at = $('.time-ago', item).text();
          const short_description = this.trim($('.excerpt', item).text());
          const other_names = $('.title-more-other', item)
            .text()
            .replace(/Tên khác: /, '')
            .split('; ');
          const status = $('.info', item)
            .text()
            .replace(/Tình trạng: /, '');
          const total_views = $('.info', item)
            .eq(1)
            .text()
            .match(/\d+/g)
            .join('');
          const followers = $('.info', item)
            .eq(2)
            .text()
            .match(/\d+/g)
            .join('');
          const chapter_name = $('.last_chapter a', item).attr('title');
          const chapter_id = $('.last_chapter a', item)
            .attr('href')
            .split('/')
            .at(-1);
          const genres = Array.from($('.list-tags p', item))
            .map((tag: any) => {
              const foundGenre = allGenres.find(
                (g: any) =>
                  $(tag).text().toLowerCase().trim() === g.name.toLowerCase()
              );
              if (!foundGenre) return null;
              return { id: foundGenre.id, name: foundGenre.name };
            })
            .filter(Boolean);
          return {
            id,
            title,
            thumbnail,
            updated_at,
            is_trending,
            genres,
            short_description,
            other_names: Array.isArray(other_names)
              ? other_names
              : [other_names],
            status: status.includes('Đang') ? 'Ongoing' : 'Completed',
            total_views: Number(total_views),
            followers: Number(followers),
            last_chapter: {
              id: Number(chapter_id),
              name: /\d+/.test(chapter_name)
                ? `Chapter ${chapter_name.match(/\d+/)[0]}`
                : chapter_name,
            },
          };
        }
      );
      return { comics, total_pages: Number(total_pages), current_page: page };
    } catch (err) {
      throw err;
    }
  }

  // ---------------------- //

  public async getGenres(type: 'compact' | 'full' = 'compact'): Promise<any> {
    try {
      const $ = await this.createRequest('', type === 'full' ? 1 : 2);
      const selector =
        type === 'compact'
          ? '.menu_hidden:nth-child(2) a'
          : '#mainNav .clearfix li a';
      return Array.from($(selector)).map((item) => {
        const id = $(item).attr('href').split('/').at(-1);
        const name = this.trim($(item).text());
        const description = $(item).attr('data-title');
        return { id: id === 'tim-truyen' ? 'all' : id, name, description };
      });
    } catch (err) {
      throw err;
    }
  }

  public async getRecommendComics(): Promise<any> {
    const $ = await this.createRequest('', 2);
    const comics = Array.from($('#div_suggest li')).map((item) => {
      const id = this.getId($('a', item).attr('href'));
      const title = $('img', item).attr('alt');
      const thumbnail = $('img', item).attr('src');
      const updated_at = this.trim($('.time-ago', item).text());
      const name = $('.last_chapter > a', item).text();
      const chapter_id = Number(
        $('.last_chapter > a', item).attr('href').split('/').at(-1)
      );
      return {
        id,
        title,
        thumbnail,
        updated_at,
        lastest_chapter: {
          id: chapter_id,
          name,
        },
      };
    });
    return comics;
  }

  public async getNewComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=15', page);
    } catch (err) {
      throw err;
    }
  }

  public async getRecentUpdateComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('tim-truyen?', page);
    } catch (err) {
      throw err;
    }
  }

  public async getTrendingComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('', page);
    } catch (err) {
      throw err;
    }
  }

  public async getBoyComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('truyen-tranh-con-trai?', page);
    } catch (err) {
      throw err;
    }
  }

  public async getGirlComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('truyen-tranh-con-gai?', page);
    } catch (err) {
      throw err;
    }
  }

  public async getComicsByGenre(
    genreId: string,
    page: number = 1
  ): Promise<any> {
    try {
      const path = genreId === 'all' ? 'tim-truyen?' : `tim-truyen/${genreId}?`;
      return await this.getComics(path, page);
    } catch (err) {
      throw err;
    }
  }

  public async getCompletedComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('tim-truyen?status=2', page, 'completed');
    } catch (err) {
      throw err;
    }
  }

  public async getTopAllComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=10', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopDailyComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=13', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopWeeklyComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=12', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopMonthlyComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=11', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopFollowComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=20', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopCommentComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=25', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopChapterComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=30', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getComicDetail(comicId: string): Promise<any> {
    try {
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${comicId}-1`),
        this.getChapters(comicId),
      ]);
      const title = $('.book_detail h1').text();
      const thumbnail = $('.book_detail img').attr('src');
      const description = this.trim($('.detail-content p').text());
      let authors = $('.author p:nth-child(2)').text();
      authors = /, |;\s*| - /.test(authors)
        ? authors.split(/, |;\s*| - /)
        : authors.toLowerCase() !== 'đang cập nhật'
        ? $('.author p:nth-child(2)').text()
        : 'Updating';
      const status =
        $('.status p:nth-child(2)').text() === 'Hoàn thành'
          ? 'Completed'
          : 'Ongoing';
      const genres = Array.from($('.list01 a')).map((item) => {
        const id = this.getId($(item).attr('href'));
        const name = $(item).text();
        return { id, name };
      });
      const other_names = $('.other_name p:nth-child(2)').text().split('; ');
      const total_views = this.formatTotal(
        $('.list-info .row:last-child p:nth-child(2)').text()
      );
      const followers = this.formatTotal(
        $('.list-info .row:nth-last-child(2) p:nth-child(2)').text()
      );
      return {
        title,
        thumbnail,
        description,
        authors,
        status,
        genres,
        total_views,
        followers,
        chapters,
        id: comicId,
        other_names: other_names[0] !== '' ? other_names : [],
      };
    } catch (err) {
      throw err;
    }
  }

  public async getChapters(comicId: string): Promise<any> {
    try {
      const $ = await this.createRequest(`truyen-tranh/${comicId}-1`, 1);
      const id = $('.star').attr('data-id');
      const { data } = await axios.get(
        `https://${this.hosts[0]}/Comic/Services/ComicService.asmx/ProcessChapterList?comicId=${id}`,
        {
          headers: {
            'User-Agent': this.agent,
          },
        }
      );
      const chapters = data.chapters?.map((chapter: any) => {
        return {
          id: chapter.chapterId,
          name: chapter.name,
        };
      });
      return chapters;
    } catch (err) {
      throw err;
    }
  }

  public async getChapter(comicId: string, chapterId: number): Promise<any> {
    try {
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${comicId}/chapter/${chapterId}`),
        this.getChapters(comicId),
      ]);
      const images = Array.from($('.page-chapter img')).map((img, idx) => {
        const src = `https://comics-api.vercel.app/images?src=${$(img).attr(
          'src'
        )}`;
        return { page: idx + 1, src };
      });
      const [comic_name, chapter_name]: any = this.trim(
        $('.detail-title').text()
      )?.split(' - ');
      return { images, chapters, chapter_name, comic_name };
    } catch (err) {
      throw err;
    }
  }

  public async getSearchSuggest(query: string): Promise<any> {
    try {
      query = query.trim();
      if (!query) throw Error('Invalid query');
      const { data } = await axios.get(
        `https:${this.hosts[0]}/Comic/Services/SuggestSearch.ashx?q=${query}`,
        { headers: { 'User-Agent': this.agent } }
      );
      const $ = load(data);
      const suggestions = Array.from($('li')).map((comic) => {
        const id = this.getId($('a', comic).attr('href'));
        const thumbnail = $('img', comic).attr('src');
        const title = $('h3', comic).text();
        const lastest_chapter = $('i', comic).first().text();
        const genres = $('i', comic).last().text();
        const authors = $('b', comic).text() || 'Updating';
        return {
          id,
          title,
          thumbnail,
          lastest_chapter: lastest_chapter.startsWith('Chapter')
            ? lastest_chapter
            : 'Updating',
          genres: genres !== lastest_chapter ? genres.split(',') : 'Updating',
          authors:
            authors === 'Đang cập nhật' ? 'Updating' : authors.split(' - '),
        };
      });
      return suggestions;
    } catch (err) {
      throw err;
    }
  }

  public async searchComics(query: string, page: number = 1): Promise<any> {
    try {
      return await this.getComics(
        `tim-truyen?keyword=${query.replace(/\s+/g, '+')}`,
        page
      );
    } catch (err) {
      throw err;
    }
  }
}

const Comics = new ComicsApi();

export { Comics };
