import jsdom from 'jsdom';
import fs from 'fs';

class CommicsApi {
  private domain: string;

  constructor(domain = 'https://www.nettruyenio.com') {
    this.domain = domain;
  }

  private async createRequest(path: string): Promise<string> {
    try {
      const res = await fetch(`${this.domain}/${path}`);
      const source = await res.text();
      return source;
    } catch (err) {
      throw err;
    }
  }

  private textToDom(text: string): Document {
    const html = new jsdom.JSDOM(text);
    return html.window.document;
  }

  private getId(link: string | null | undefined): string | undefined {
    return link?.match(/[^/]+$/)?.[0];
  }

  private getChapter(chapterName: string | undefined | null): number {
    return Number(chapterName?.split(' ')[1]);
  }

  private trim(text: string | null | undefined): string | undefined {
    return text?.replace(/\n/g, '').trim();
  }

  private async getComics(path: string, page: number): Promise<any> {
    const keys: any = {
      'Thể loại': 'genres',
      'Tình trạng': 'status',
      'Lượt xem': 'total_views',
      'Bình luận': 'total_comments',
      'Theo dõi': 'total_followers',
      'Tên khác': 'other_names',
      'Ngày cập nhật': 'updated_at',
      'Tác giả': 'author',
    };
    try {
      const data = await this.createRequest(`${path}page=${page}`);
      const body = await this.textToDom(data);
      const total_pages =
        body
          .querySelector('a[title="Trang cuối"]')
          ?.getAttribute('href')
          ?.split('=')
          .at(-1) ?? 1;
      if (page > Number(total_pages)) {
        return { status: 400, message: 'Invalid page' };
      }
      const items = body.querySelectorAll('#ctl00_divCenter .item');
      let comics: any = [];
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const thumbnail =
          'https:' +
          item.querySelector('.image img')?.getAttribute('data-original');
        const title = this.trim(
          item.querySelector('figcaption h3')?.textContent
        );
        const id = this.getId(item.querySelector('a')?.getAttribute('href'));
        const is_trending = item.querySelector('.icon-hot') ? true : false;
        const short_description = this.trim(
          item.querySelector('.box_text')?.textContent
        );
        const cols = Array.from(item.querySelectorAll('.message_main p')).map(
          (col) => {
            const [label, detail]: any = this.trim(col?.textContent)?.split(
              ':'
            );
            return {
              [keys[label]]: /, |;| - /.test(detail)
                ? detail.split(/, |;| - /)
                : detail,
            };
          }
        );
        const lastest_chapters = Array.from(
          item.querySelectorAll('.comic-item li')
        ).map((item) => {
          const id = Number(item.querySelector('a')?.getAttribute('data-id'));
          const chapter = this.getChapter(item.querySelector('a')?.textContent);
          const updated_at = item.querySelector('.time')?.textContent;
          return {
            id,
            chapter,
            updated_at,
          };
        });
        comics.push(
          Object.assign({}, ...cols, {
            thumbnail,
            title,
            id,
            is_trending,
            short_description,
            lastest_chapters,
          })
        );
      }
      return { comics, total_pages: Number(total_pages), current_page: page };
    } catch (err) {
      throw err;
    }
  }

  public async getGenres(): Promise<any> {
    try {
      const data = await this.createRequest('');
      const body = await this.textToDom(data);
      const items = body.querySelectorAll('.dropdown-menu .clearfix li a');
      let genres: any = [];
      items.forEach((item) => {
        const id = this.getId(item.getAttribute('href'));
        const title = this.trim(item.textContent);
        const description = item.getAttribute('data-title');
        genres.push({ id, title, description });
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
    const data = await this.createRequest(keys[type]);
    const body = await this.textToDom(data);
    const items = body.querySelectorAll('#ctl00_divAlt1 div.item');
    let comics: any = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const title = item.querySelector('a')?.getAttribute('title');
      const thumbnail =
        'https:' + item.querySelector('img')?.getAttribute('data-src');
      const lastest_chapter = this.getChapter(
        item.querySelector('.slide-caption > a')?.textContent
      );
      const updated_at = this.trim(item.querySelector('.time')?.textContent);
      const chapter_id = Number(
        item
          .querySelector('.slide-caption > a')
          ?.getAttribute('href')
          ?.split('/')
          .at(-1)
      );
      comics.push({
        title,
        thumbnail,
        lastest_chapter,
        updated_at,
        chapter_id,
      });
    }
    return comics;
  }

  public async getNewUpdate(page: number = 1): Promise<any> {
    try {
      return await this.getComics('?', page);
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
      return await this.getComics(`tim-truyen?keyword=${query}&`, page);
    } catch (err) {
      throw err;
    }
  }
}

const comics = new CommicsApi();
comics.getGenres().then((data) => console.log(data.length));
