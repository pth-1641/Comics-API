import * as cheerio from 'cheerio';
import axios from 'axios';

type Status = 'all' | 'completed' | 'updating';
class ComicsApi {
  private domain: string;

  constructor() {
    this.domain = 'https://www.nettruyen.com';
  }

  private async createRequest(path: string): Promise<any> {
    try {
      const { data } = await axios.request({
        method: 'GET',
        url: `${this.domain}/${path}`.replace(/\?+/g, '?'),
        headers: {
          'User-Agent': '*',
        },
      });
      return cheerio.load(data);
    } catch (err) {
      throw err;
    }
  }

  private getChapterId(link: string | null | undefined): string | undefined {
    return link?.match(/[^/]+$/)?.[0];
  }

  private getChapterName(chapterName: string | undefined | null): number {
    return Number(chapterName?.match(/(\d+(\.\d+)?)/)?.[1]);
  }

  private formatTotal(total: string | undefined | null): number | string {
    return total === 'N/A' ? 'Updating' : Number(total?.replace(/\./, ''));
  }

  private trim(text: string | null | undefined): string | undefined {
    return text?.replace(/\n/g, '').trim();
  }

  private async getComics(
    path: string,
    page: number = 1,
    statusKey: Status = 'all'
  ): Promise<any> {
    const keys: any = {
      'Thể loại': 'genres',
      'Tình trạng': 'status',
      'Lượt xem': 'total_views',
      'Bình luận': 'total_comments',
      'Theo dõi': 'followers',
      'Tên khác': 'other_names',
      'Ngày cập nhật': 'updated_at',
      'Tác giả': 'author',
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
        $('#ctl00_mainContent_ctl00_divPager li.active a').text() ||
        1;
      if (page > Number(total_pages)) {
        return { status: 404, message: 'Page not found' };
      }
      const comics = Array.from($('#ctl00_divCenter .item')).map((item) => {
        const thumbnail =
          'https:' + $('.image img', item).attr('data-original');
        const title = this.trim($('figcaption h3', item).text());
        const id = this.getChapterId($('a', item).attr('href'));
        const is_trending = !!$('.icon-hot', item).toString();
        const short_description = $('.box_text', item).text();
        const cols = Array.from($('.message_main p', item)).map((col) => {
          const [_, label, detail]: any = this.trim($(col).text())?.match(
            /^(.*?):(.*)$/
          );
          const value = /, |;\s*| - /.test(detail)
            ? detail.split(/, |;\s*| - /)
            : detail;
          const key = keys[label];
          if (key === 'genres') {
            const genres = value.map((genre: string) => {
              const foundGenre = allGenres.find((g: any) => g.title === genre);
              return { id: foundGenre?.id, title: foundGenre?.title };
            });
            return { genres };
          }
          if (key === 'status') {
            return {
              status: value === 'Hoàn thành' ? 'Completed' : 'Updating',
            };
          }
          return {
            [key]: value,
          };
        });
        const lastest_chapters = Array.from($('.comic-item li', item)).map(
          (chap) => {
            const id = Number($('a', chap).attr('data-id'));
            const chapter = this.getChapterName($('a', chap).text());
            const updated_at = $('.time', chap).text();
            return {
              id,
              chapter,
              updated_at,
            };
          }
        );
        return Object.assign(
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
            author: 'Updating',
          },
          ...cols
        );
      });
      return { comics, total_pages: Number(total_pages), current_page: page };
    } catch (err) {
      throw err;
    }
  }

  public async getChapters(comicId: string): Promise<any> {
    try {
      const [_, slug] = comicId.split(/^([\w-]+)(?:-\d+)?$/);
      const $ = await this.createRequest(`truyen-tranh/${slug}`);
      const id = $('.star').attr('data-id');
      const { data } = await axios.get(
        `${this.domain}/Comic/Services/ComicService.asmx/ProcessChapterList?comicId=${id}`,
        {
          headers: {
            'User-Agent': '*',
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

  public async getGenres(): Promise<any> {
    try {
      const $ = await this.createRequest('');
      const genres = Array.from($('#mainNav .clearfix li a')).map((item) => {
        const id = this.getChapterId($(item).attr('href'));
        const title = this.trim($(item).text());
        const description = $(item).attr('data-title');
        return { id: id === 'tim-truyen' ? 'all' : id, title, description };
      });
      return [
        ...genres,
        {
          id: '16',
          title: '16+',
          description:
            'Là thể loại có nhiều cảnh nóng, đề cập đến các vấn đề nhạy cảm giới tính hay các cảnh bạo lực máu me .... Nói chung là truyện có tác động xấu đến tâm sinh lý của những độc giả chưa đủ 16 tuổi',
        },
      ];
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
      const title = $('a', item).attr('title');
      const thumbnail = 'https:' + $('img', item).attr('data-src');
      const updated_at = this.trim($('.time', item).text());
      const id = Number(
        $('.slide-caption > a', item).attr('href').split('/').at(-1)
      );
      const name = $('.slide-caption > a', item).text();
      return {
        title,
        thumbnail,
        updated_at,
        lastest_chapter: {
          id,
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
      return await this.getComics('truyen-full', page);
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

  public async getTrending(page: number = 1): Promise<any> {
    try {
      return await this.getComics('hot?', page);
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
      const description = $('.detail-content p').text().replace(/\n/g, '. ');
      let author = $('.author p:nth-child(2)').text();
      author =
        author !== 'Đang cập nhật'
          ? $('.author p:nth-child(2)').text()
          : 'Updating';
      const status =
        $('.status p:nth-child(2)').text() === 'Hoàn thành'
          ? 'Finished'
          : 'Updating';
      const genres = Array.from($('.kind p:nth-child(2) a')).map((item) => {
        const id = this.getChapterId($(item).attr('href'));
        const name = $(item).text();
        return { id, name };
      });
      const is_adult = !!$('.alert-danger').toString();
      const other_names = $('.other-name')
        .text()
        .split(/, |;| - /)
        .map((x: string) => x.trim());
      const total_views = this.formatTotal(
        $('.list-info .row:last-child p:nth-child(2)').text()?.replace(/\./, '')
      );
      const rating_count = Number($('span[itemprop="ratingCount"]').text());
      const average = Number($('span[itemprop="ratingValue"]').text());
      const followers = this.formatTotal($('.follow b').text());
      return {
        title,
        description,
        author,
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

  public async getImages(comicId: string, chapterId: number): Promise<any> {
    try {
      const id = comicId.replace(/-\d+$/, '');
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${id}/chapter/${chapterId}`),
        this.getChapters(comicId),
      ]);
      const images = Array.from($('.page-chapter img')).map((img) => {
        const page = Number($(img).attr('data-index'));
        const src = `https://api-comics-9g0r.onrender.com?src=https:${$(
          img
        ).attr('src')}`;
        return { page, src };
      });
      return { images, chapters };
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

  public async getComments(
    comicId: string,
    page: number = 1,
    sortBy: 'default' | 'newest' = 'default'
  ): Promise<any> {
    try {
      const body = await this.createRequest(`truyen-tranh/${comicId}`);
      const id = body('.star').attr('data-id');
      const token = body('#ctl00_divCenter > script')
        .text()
        .match(/'([^']+)'/)[1];
      const orderBy = sortBy === 'newest' ? 5 : 0;
      const { data } = await axios.get(
        `${this.domain}/Comic/Services/CommentService.asmx/List?comicId=${id}&orderBy=${orderBy}&chapterId=-1&parentId=0&pageNumber=${page}&token=${token}`,
        { headers: { 'User-Agent': '*' } }
      );
      if (!data.success) {
        return {
          status: 400,
          message: 'Something went wrong!',
        };
      }
      const total_comments = Number(data.commentCount.replace(',', ''));
      const $ = cheerio.load(data.response);
      const total_pages = Math.ceil(total_comments / 15);
      if (page > total_pages) {
        return { status: 400, message: 'Invalid page' };
      }
      const comments = Array.from($('.clearfix')).map((item) => {
        const avatar = 'https:' + $('.avatar img', item).attr('src');
        const username = $(item).find('.authorname').first().text().trim();
        const content = $('.comment-content', item).first().text().trim();
        const stickers = Array.from(
          $('.comment-content > img', item).first()
        ).map((img) => 'https:' + $(img).attr('src'));
        const created_at = $('.comment-footer abbr', item)
          .first()
          .attr('title');
        const replies = Array.from($('.item', item)).map((reply) => {
          const avatar = 'https:' + $('.avatar img', reply).attr('src');
          const username = $('.authorname', reply).text().trim();
          const content = $('.comment-content', reply)
            .clone()
            .children()
            .remove()
            .end()
            .text()
            .trim();
          const stickers = Array.from($('.comment-content > img', reply)).map(
            (img) => 'https:' + $(img).attr('src')
          );
          const created_at = $('.comment-footer abbr', item)
            .attr('title')
            ?.replace(/( AM| PM)$/, '');
          return { avatar, username, content, stickers, created_at };
        });
        return { avatar, username, content, stickers, replies, created_at };
      });
      return { comments, total_comments, total_pages };
    } catch (err) {
      throw err;
    }
  }
}

const Comics = new ComicsApi();

export { Comics };
