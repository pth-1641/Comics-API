# Comics API

Vietnamese Comics API for client using scraping technique

## ⚠️ Unofficial API from [Nettruyen](https://nettruyen.com)

## Installation

```bash
npm i comics-api
#or
yarn add comics-api
```

```bash
import { Comics } from "comics-api"
#or
const { Comics } = require("comics-api")
```

## Usage

### _Chapters_

> comicId: string

```javascript
Comics.getChapters('tham-tu-conan-46391');
```

### _Comments_

> chapter: string \
> page: number _(option)_ \
> sortBy: default | newest _(option)_ \

```javascript
Comics.getComments('tham-tu-conan-46391');
```

### _Search Comics_

> query: string \
> page: number _(option)_

```javascript
Comics.searchComics('conan');
```

### _Comic Detail_

> comicId: string

```javascript
Comics.getComicDetail('tham-tu-conan-46391');
```

### _Images By Chapter_

> comicId: string \
> chapterId: number

```javascript
Comics.getImages('tham-tu-conan-46391', 1011493);
```

### _Genres_

```javascript
Comics.getGenres();
```

### _Trending Comics_

> page: number _(option)_

```javascript
Comics.getTrending();
```

### _Recommend Comics_

> type: hot | boy | girl _(option)_

```javascript
Comics.getRecommendComics();
```

### _New Update Comics_

> page: number _(option)_

```javascript
Comics.getNewUpdateComics();
```

### _Completed Comics_

> page: number _(option)_

```javascript
Comics.getCompletedComics();
```

### _Boy Comics_

> page: number _(option)_

```javascript
Comics.getBoyComics();
```

### _Girl Comics_

> page: number _(option)_

```javascript
Comics.getGirlComics();
```

### _New Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getNewComics();
```

### _Comics By Genre_

> genreId: string \
> page: number _(option)_ \
> status: all | finished | updating _(option)_

```javascript
Comics.getComicsByGenre();
```

### _Top Daily_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopDailyComics();
```

### _Top Weekly_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopWeeklyComics();
```

### _Top Monthly_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopMonthlyComics();
```

### _Top Follow Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopFollowComics();
```

### _Top Comment Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopCommentComics();
```

### _Top All Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopAllComics();
```

### _Top Chapter Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopChapterComics();
```
