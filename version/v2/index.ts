import axios from 'axios';
import { load } from 'cheerio';
import userAgent from 'random-useragent';

type Status = 'all' | 'completed' | 'ongoing';
class ComicsApi {
  private domain: string;
  private agent: string;

  constructor() {
    this.domain = process.env.NETTRUYEN_BASE_URL as string;
    this.agent = userAgent.getRandom();
  }

  private async createRequest(path: string): Promise<any> {
    try {
      const { data } = await axios.request({
        method: 'GET',
        url: `${this.domain}/${path}`.replace(/\?+/g, '?'),
        headers: {
          'User-Agent': this.agent,
        },
      });
      return load(data);
    } catch (err) {
      throw err;
    }
  }

  private getComicId(link?: string): string | undefined {
    if (!link) return '';
    return link.split('/').at(-1);
  }

  private getGenreId(link: string): string | undefined {
    if (!link) return '';
    return link?.match(/[^/]+$/)?.[0];
  }

  private formatTotal(total: string): number | string {
    if (!total) return 0;
    return total === 'N/A' ? 'Updating' : Number(total?.replace(/\./g, ''));
  }

  private trim(text: string): string | undefined {
    return text?.replace(/\n/g, '').trim();
  }

  private async getComics(
    path: string,
    page: number = 1,
    statusKey: Status = 'all'
  ): Promise<any> {
    const keys: Record<string, string> = {
      'Thể loại': 'genres',
      'Tình trạng': 'status',
      'Lượt xem': 'total_views',
      'Bình luận': 'total_comments',
      'Theo dõi': 'followers',
      'Tên khác': 'other_names',
      'Ngày cập nhật': 'updated_at',
      'Tác giả': 'authors',
    };
    const status: any = {
      all: -1,
      updating: 1,
      completed: 2,
    };
    if (!status[statusKey]) throw Error('Invalid status');
    try {
      const [$, allGenres] = await Promise.all([
        this.createRequest(
          path.includes('tim-truyen')
            ? `${path}&status=${status[statusKey]}&page=${page}`
            : `${path + (path.includes('?') ? '&' : '?')}page=${page}`
        ),
        this.getGenres(),
      ]);
      const total_pages =
        $('a[title="Trang cuối"]')?.attr('href')?.split('=').at(-1) ||
        $('.pagination-outter li.active a').text() ||
        1;
      if (page > Number(total_pages)) {
        return { status: 404, message: 'Page not found' };
      }
      const comics = Array.from($('#ctl00_divCenter .item')).map((item) => {
        const thumbnail = $('.image img', item).attr('data-original');
        const title = this.trim($('figcaption h3', item).text());
        const id = this.getComicId($('a', item).attr('href'));
        const is_trending = !!$('.icon-hot', item).toString();
        const short_description = $('.box_text', item)
          .text()
          .replace(/-/g, '')
          .replace(/\n/g, ' ');
        const cols = Array.from($('.message_main p', item)).map((col) => {
          const [_, label, detail]: any = this.trim($(col).text())?.match(
            /^(.*?):(.*)$/
          );
          const value = /,|;\s*| - /.test(detail)
            ? detail.split(/,|;\s*| - /)
            : detail;
          const key = keys[label];
          if (key === 'genres') {
            const genresList = Array.isArray(value) ? value : [value];
            const genres = genresList.map((genre: string) => {
              const foundGenre = allGenres.find(
                (g: any) => g.name.toLowerCase() === genre.toLowerCase()
              );
              return { id: foundGenre?.id, name: foundGenre?.name };
            });
            return { genres };
          }
          if (key === 'status') {
            return {
              status: value === 'Hoàn thành' ? 'Completed' : 'Ongoing',
            };
          }
          return {
            [key]: value,
          };
        });
        const lastest_chapters = Array.from($('.comic-item li', item)).map(
          (chap) => {
            const id = Number($('a', chap).attr('data-id'));
            const name = $('a', chap).attr('title');
            const updated_at = $('.time', chap).text();
            return {
              id,
              name,
              updated_at,
            };
          }
        );
        const comic = Object.assign(
          {},
          {
            thumbnail,
            title,
            id,
            is_trending,
            short_description,
            lastest_chapters,
            genres: [],
            other_names: [],
            status: 'Updating',
            total_views: 'Updating',
            total_comments: 'Updating',
            followers: 'Updating',
            updated_at: 'Updating',
            authors: 'Updating',
          },
          ...cols
        );
        return {
          ...comic,
          total_comments: +comic.total_comments.toString().replace(/\,/g, ''),
          followers: +comic.followers.toString().replace(/\,/g, ''),
        };
      });
      return { comics, total_pages: Number(total_pages), current_page: page };
    } catch (err) {
      throw err;
    }
  }

  public async getChapters(comicId: string): Promise<any> {
    try {
      const $ = await this.createRequest(`truyen-tranh/${comicId}`);
      const id = $('.star').attr('data-id');
      const { data } = await axios.get(
        `${this.domain}/Comic/Services/ComicService.asmx/ProcessChapterList?comicId=${id}`,
        {
          headers: {
            'User-Agent': this.agent,
          },
        }
      );
      const chapters = data.chapters?.map((chapter: any) => {
        return {
          id: +chapter.url.split('-').at(-1),
          name: chapter.name,
        };
      });
      return chapters;
    } catch (err) {
      throw err;
    }
  }

  public async getGenres(): Promise<any> {
    try {
      const $ = await this.createRequest('');
      const genres = Array.from($('#mainNav .clearfix li a')).map((item) => {
        const id = this.getGenreId($(item).attr('href'));
        const name = this.trim($(item).text());
        const description = $(item).attr('data-title');
        return { id: id === 'tim-truyen' ? 'all' : id, name, description };
      });
      return genres;
    } catch (err) {
      throw err;
    }
  }

  public async getRecommendComics(
    type: 'hot' | 'boy' | 'girl' = 'hot'
  ): Promise<any> {
    const keys = {
      hot: 'hot',
      boy: 'truyen-con-trai',
      girl: 'truyen-con-gai',
    };
    const $ = await this.createRequest(keys[type]);
    const comics = Array.from($('#ctl00_divAlt1 div.item')).map((item) => {
      const id = this.getComicId($('a', item).attr('href'));
      const title = $('a', item).attr('title');
      const thumbnail = $('img', item).attr('data-original');
      const updated_at = this.trim($('.time', item).text());
      const chapter_id = Number(
        $('.slide-caption > a', item).attr('href').split('-').at(-1)
      );
      const name = $('.slide-caption > a', item).attr('title');
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

  public async getRecentUpdateComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('', page);
    } catch (err) {
      throw err;
    }
  }

  public async getCompletedComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('tim-truyen?', page, 'completed');
    } catch (err) {
      throw err;
    }
  }

  public async getNewComics(
    status: Status = 'all',
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics('tim-truyen?sort=15', page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getComicsByGenre(
    genreId: string,
    page: number = 1,
    status: Status = 'all'
  ): Promise<any> {
    try {
      const path = genreId === 'all' ? 'tim-truyen?' : `tim-truyen/${genreId}?`;
      return await this.getComics(path, page, status);
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

  public async getTrendingComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('truyen-tranh-hot?', page);
    } catch (err) {
      throw err;
    }
  }

  public async getBoyComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('truyen-con-trai?', page);
    } catch (err) {
      throw err;
    }
  }

  public async getGirlComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics('truyen-con-gai?', page);
    } catch (err) {
      throw err;
    }
  }

  public async searchComics(query: string, page: number = 1): Promise<any> {
    try {
      return await this.getComics(
        `tim-truyen?keyword=${query.replace(/\s+/g, '+')}&`,
        page
      );
    } catch (err) {
      throw err;
    }
  }

  public async getComicDetail(comicId: string): Promise<any> {
    try {
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${comicId}`),
        this.getChapters(comicId),
      ]);
      const title = $('.title-detail').text();
      const thumbnail = $('#item-detail .col-image img').attr('src');
      const description = $('.shortened div')
        .text()
        .replace(/\n/g, ' ')
        .replace(/-/g, '')
        .replace(/NhatTruyen/g, 'NComics')
        .trim();
      let authors = $('.author p:nth-child(2)').text();
      authors = /, |;\s*| - /.test(authors)
        ? authors.split(/, |;\s*| - /)
        : authors !== 'Đang cập nhật'
        ? $('.author p:nth-child(2)').text()
        : 'Updating';
      const status =
        $('.status p:nth-child(2)').text() === 'Hoàn thành'
          ? 'Finished'
          : 'Ongoing';
      const genres = Array.from($('.kind p:nth-child(2) a')).map((item) => {
        const id = this.getGenreId($(item).attr('href'));
        const name = $(item).text();
        return { id, name };
      });
      const is_adult = !!$('.alert-danger').toString();
      const other_names = $('.other-name')
        .text()
        .split(/, |;| - /)
        .map((x: string) => x.trim());
      const total_views = this.formatTotal(
        $('.list-info .row:last-child p:nth-child(2)').text()
      );
      const rating_count = Number($('span[itemprop="ratingCount"]').text());
      const average = Number($('span[itemprop="ratingValue"]').text());
      const followers = this.formatTotal($('.follow b').text());
      return {
        title,
        thumbnail,
        description,
        authors,
        status,
        genres,
        total_views,
        average,
        rating_count,
        followers,
        chapters,
        id: comicId,
        is_adult,
        other_names: other_names[0] !== '' ? other_names : [],
      };
    } catch (err) {
      throw err;
    }
  }

  public async getChapter(comicId: string, chapterId: number): Promise<any> {
    try {
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${comicId}/chuong-${chapterId}`),
        this.getChapters(comicId),
      ]);
      const images = Array.from($('.page-chapter img')).map((img, idx) => {
        const src = `/images?src=${$(img).attr('data-sv1')}`;
        const backup_url = `/images?src=${$(img).attr('data-sv2')}`;
        const page = parseInt(src.split('/')?.at(-1) || `${idx}`);
        return { page, src, backup_url };
      });
      const chapter_name = $('.breadcrumb li:last-child').first().text();
      const comic_name = $('.breadcrumb li:nth-last-child(2)').first().text();
      return { images, chapters, chapter_name, comic_name };
    } catch (err) {
      throw err;
    }
  }

  public async getComicsByAuthor(alias: string) {
    try {
      return this.getComics(`/tim-truyen?tac-gia=${alias.replace(/\s+/, '+')}`);
    } catch (err) {
      throw err;
    }
  }

  public async getComments(comicId: string, page: number = 1): Promise<any> {
    try {
      const avatar = 'https://api.iconify.design/ei/user.svg?height=48';
      const body = await this.createRequest(`truyen-tranh/${comicId}`);
      const id = body('.star').attr('data-id');
      const url = `${this.domain}/Comic/Services/CommentService.asmx/List?comicId=${id}&pageNumber=${page}`;
      const { data } = await axios.get(url, {
        headers: { 'User-Agent': this.agent },
      });
      const total_comments = data.data.commentCount;
      const $ = load(data.data.response);
      const total_pages = Math.ceil(total_comments / 15);
      if (page > total_pages) {
        return { status: 400, message: 'Invalid page' };
      }
      const comments = Array.from($('.clearfix')).map((item) => {
        const username = $(item).find('.authorname').first().text().trim();
        const content = $('.comment-content', item).first().text().trim();
        const stickers = Array.from(
          $(item).find('> .summary > .info > .comment-content > img')
        ).map(
          (img) =>
            $(img)
              .attr('src')
              ?.match(/url=(.*)$/)?.[1]
        );
        const created_at = $('.comment-footer abbr', item)
          .first()
          .attr('title');
        const replies = Array.from($('.item', item)).map((reply) => {
          const username = $('.authorname', reply).text().trim();
          const content = $('.comment-content', reply)
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();
          const stickers = Array.from($('.comment-content > img', reply)).map(
            (img) =>
              $(img)
                .attr('src')
                ?.match(/url=(.*)$/)?.[1]
          );
          const created_at = $('.comment-footer abbr', reply).attr('title');
          const mention_user = $('.mention-user', reply).text().trim();
          return {
            avatar,
            username,
            content,
            stickers,
            created_at,
            vote_count: 0,
            mention_user,
          };
        });
        return {
          avatar,
          username,
          content,
          stickers,
          replies,
          created_at,
          vote_count: 0,
        };
      });
      return { comments, total_comments, total_pages, current_page: page };
    } catch (err) {
      throw err;
    }
  }

  public async getSearchSuggest(query: string): Promise<any> {
    try {
      query = query.trim();
      if (!query) throw Error('Invalid query');
      const { data } = await axios.get(
        `${this.domain}/Comic/Services/SuggestSearch.ashx?q=${query}`,
        { headers: { 'User-Agent': this.agent } }
      );
      const $ = load(data);
      const suggestions = Array.from($('li')).map((comic) => {
        const id = this.getComicId($('a', comic).attr('href'));
        const thumbnail = 'https:' + $('img', comic).attr('src');
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
          genres: genres !== lastest_chapter ? genres.split(', ') : 'Updating',
          authors: authors === 'Updating' ? authors : authors.split(' - '),
        };
      });
      return suggestions;
    } catch (err) {
      throw err;
    }
  }
}

const Comics = new ComicsApi();

export { Comics };
