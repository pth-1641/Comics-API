import { load } from "cheerio";
import axios from "axios";
import dotenv from "dotenv";
import https from "https";
import userAgent from "random-useragent";

dotenv.config();

const agent = new https.Agent({
  rejectUnauthorized: false,
});

type Status = "all" | "completed" | "ongoing";
class ComicsApi {
  private agent: string;
  private hosts: string[];
  private cdnImageUrl: string;
  // private cdnProviders: string[];
  // private providers: string[];

  constructor() {
    this.hosts = process.env.HOSTS?.split(" | ") as string[];
    this.agent = userAgent.getRandom();
    this.cdnImageUrl = process.env.CND_IMAGE_URL as string;
    // this.providers = process.env.PROVIDERS?.split(" | ") as string[];
    // this.cdnProviders = process.env.CDN_PROVIDERS?.split(" | ") as string[];
  }

  private async createRequest(path: string, host: number = 0): Promise<any> {
    try {
      const { data } = await axios.request({
        method: "GET",
        url: `https://${this.hosts[host]}/${path}`.replace(/\?+/g, "?"),
        headers: {
          "User-Agent": this.agent,
        },
        httpsAgent: agent,
      });
      return load(data);
    } catch (err) {
      throw err;
    }
  }

  private getId(link?: string, type?: "comic" | "genre"): string | undefined {
    if (!link) return "";
    const regex = type === "genre" ? /\/([^/]+?)$/ : /\/([^/]+?)(?:-\d+)?$/;
    return link?.match(regex)?.[1];
  }

  private getChapterId(link?: string): number {
    if (!link) return 0;
    return Number(link?.match(/chapter-(\d+)/i)?.[1] || 0);
  }

  private formatTotal(total: string): number | string {
    if (!total) return 0;
    return total === "N/A" ? "Updating" : Number(total?.replace(/\.|\,/g, ""));
  }

  private trim(text: string): string | undefined {
    return text?.replace(/\n|\t/g, "").trim();
  }

  private async getComics(
    path: string,
    page: number = 1,
    statusKey: Status = "all"
  ): Promise<any> {
    const status: any = {
      all: -1,
      updating: 1,
      completed: 2,
    };
    try {
      const $ = await this.createRequest(
        `${path + (path.includes("?") ? "&" : "?")}status=${
          status[statusKey]
        }&page=${page}`
      );
      const total_pages =
        $(".pagination li:nth-last-child(2) a")
          .attr("href")
          ?.split("=")
          .at(-1) ||
        $(".pagination .active").text() ||
        1;
      if (page > total_pages) {
        return { status: 404, message: "Page not found" };
      }
      const comics: any = Array.from($("#ctl00_divCenter .item")).map(
        (item) => {
          const id = this.getId($("a", item).attr("href"));
          const thumbnail = $("img", item).attr("src");
          const title = this.trim($("figcaption h3", item).text());
          const is_trending = !!$(".hot", item).toString();
          const [total_views, comments, followers] =
            this.trim($(".pull-left", item).text())?.split(/\s+/g) || [];
          const last_chapters = Array.from($(".comic-item .chapter", item)).map(
            (chapter) => {
              const id = this.getChapterId($("a", chapter).attr("href"));
              const name = this.trim($("a", chapter).text());
              const updated_at = $(".time", chapter).text();
              return {
                id,
                name,
                updated_at,
              };
            }
          );
          return {
            id,
            title,
            thumbnail,
            backup_thumb: `${this.cdnImageUrl}/${id}.jpg`,
            updated_at: last_chapters[0]?.updated_at || "N/A",
            is_trending,
            total_views: total_views || "N/A",
            followers: followers || comments || "N/A",
            last_chapters,
          };
        }
      );
      return {
        comics,
        total_pages: +total_pages,
        current_page: page,
      };
    } catch (err) {
      throw err;
    }
  }

  public async getGenres(): Promise<any> {
    try {
      const $ = await this.createRequest("");
      return Array.from($("#mainNav li:nth-child(7) a")).map((item) => {
        const id = $(item).attr("href").split("/").at(-1);
        const name = this.trim($(item).text());
        return {
          id: id === "tim-truyen" ? "all" : id,
          name: id === "tim-truyen" ? "Tất cả" : name,
        };
      });
    } catch (err) {
      throw err;
    }
  }

  public async getRecommendComics(): Promise<any> {
    const $ = await this.createRequest("");
    const comics = Array.from($(".owl-carousel .item")).map((item) => {
      const id = this.getId($("a", item).attr("href"));
      const title = $("a", item).attr("alt");
      const thumbnail = $("img", item).attr("src");
      const updated_at = this.trim($(".time", item).text());
      const name = $(".slide-caption > a", item).text();
      const chapter_id = this.getChapterId(
        $(".slide-caption > a", item).attr("href")
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

  public async getNewComics(page: number = 1, status: Status): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=8", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getRecentUpdateComics(
    page: number = 1,
    status: Status
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTrendingComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=12", page);
    } catch (err) {
      throw err;
    }
  }

  public async getBoyComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics("truyen-tranh-con-trai?", page);
    } catch (err) {
      throw err;
    }
  }

  public async getGirlComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics("truyen-tranh-con-gai?", page);
    } catch (err) {
      throw err;
    }
  }

  public async getComicsByGenre(
    genreId: string,
    page: number = 1,
    status: Status
  ): Promise<any> {
    try {
      const path = genreId === "all" ? "tim-truyen?" : `tim-truyen/${genreId}?`;
      return await this.getComics(path, page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getCompletedComics(page: number = 1): Promise<any> {
    try {
      return await this.getComics("tim-truyen?status=2", page, "completed");
    } catch (err) {
      throw err;
    }
  }

  public async getTopAllComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=10", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopDailyComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=13", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopWeeklyComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=12", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopMonthlyComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=11", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopFollowComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=20", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopCommentComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=25", page, status);
    } catch (err) {
      throw err;
    }
  }

  public async getTopChapterComics(
    status: Status = "all",
    page: number = 1
  ): Promise<any> {
    try {
      return await this.getComics("tim-truyen?sort=30", page, status);
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
      const title = $(".title-detail").text();
      const thumbnail = $(".detail-info img").attr("src");
      const description =
        this.trim(
          $(".detail-content p")
            .text()
            .replace(/nettruyen/gi, "NComics")
            .replace(/\s+/g, " ")
        ) ||
        `Truyện tranh ${title} được cập nhật nhanh và đầy đủ nhất tại NComics. Bạn đọc đừng quên để lại bình luận và chia sẻ, ủng hộ NComics ra các chương mới nhất của truyện ${title}.`;
      let authors = $(".author p:nth-child(2)").text();
      authors = /, |;\s*| - /.test(authors)
        ? authors
            .split(/, |;\s*| - /)
            .map((author: string) => this.trim(author))
        : authors.toLowerCase() !== "đang cập nhật"
        ? this.trim($(".author p:nth-child(2)").text())
        : "Updating";
      const status =
        $(".status p:nth-child(2)").text() === "Hoàn thành"
          ? "Completed"
          : "Ongoing";
      const genres = Array.from($(".kind p:nth-child(2) a")).map((item) => {
        const id = this.getId($(item).attr("href"), "genre");
        const name = $(item).text();
        return { id, name };
      });
      const other_names = $(".othername h2").text().split("; ");
      const total_views = this.formatTotal(
        $("#item-detail li:nth-child(5) p:nth-child(2)").text()
      );
      const followers = this.formatTotal($(".follow b").text());
      const rate = $("span[itemprop='ratingValue']").text() * 2;
      const total_vote = this.formatTotal(
        $("span[itemprop='ratingCount']").text()
      );
      return {
        title,
        thumbnail,
        backup_thumb: `${this.cdnImageUrl}/${comicId}.jpg`,
        description,
        status,
        genres,
        total_views,
        followers,
        rate,
        total_vote,
        authors,
        id: comicId,
        other_names: other_names[0] !== "" ? other_names : [],
        chapters,
      };
    } catch (err) {
      throw err;
    }
  }

  public async getChapters(comicId: string): Promise<any> {
    try {
      const $ = await this.createRequest(`truyen-tranh/${comicId}-1`);
      const chapters = Array.from($(".list-chapter ul .row")).map((chapter) => {
        const name = $("a", chapter).text();
        const id = this.getChapterId($("a", chapter).attr("href"));
        const updated_at = $(".no-wrap", chapter).text().trim();
        const total_view = this.formatTotal(
          $("div:last-child", chapter).text()
        );
        return { id, name, updated_at, total_view };
      });
      return chapters;
    } catch (err) {
      throw err;
    }
  }

  public async getChapter(comicId: string, chapterId: number): Promise<any> {
    try {
      const [$, chapters] = await Promise.all([
        this.createRequest(`truyen-tranh/${comicId}/chapter-${chapterId}/0`),
        this.getChapters(comicId),
      ]);
      const images = Array.from($(".page-chapter img")).map((img, idx) => ({
        page: idx + 1,
        src: $(img).attr("src"),
      }));
      const [comic_name, chapter_name]: any = this.trim(
        $(".txt-primary").text().trim()
      )?.split(" - ");
      return { images, chapters, chapter_name, comic_name };
    } catch (err) {
      throw err;
    }
  }

  public async getSearchSuggest(query: string): Promise<any> {
    try {
      query = query.trim();
      if (!query) throw Error("Invalid query");
      const $ = await this.createRequest(`webapi/suggest-search?q=${query}`);
      const suggestions = Array.from($("li")).map((comic) => {
        const id = this.getId($("a", comic).attr("href"));
        const thumbnail = $("img", comic).attr("src");
        const title = $("h3", comic).text();
        const lastest_chapter = $("i", comic).first().text();
        return {
          id,
          title,
          thumbnail,
          lastest_chapter: lastest_chapter.startsWith("Tới")
            ? lastest_chapter.replace(/Tới /i, "")
            : "Updating",
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
        `tim-truyen?q=${query.trim().replace(/\s+/g, "+")}`,
        page
      );
    } catch (err) {
      throw err;
    }
  }
}

const Comics = new ComicsApi();

export { Comics };
