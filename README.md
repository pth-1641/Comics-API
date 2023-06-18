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
Nuxtify.getChapters('tham-tu-conan-46391');
```

### _Search Comics_

> query: string \
> page: number _(option)_

```javascript
Nuxtify.searchComics('conan');
```

### _Comic Detail_

> comicId: string

```javascript
Nuxtify.getComicDetail('tham-tu-conan-46391');
```

### _Images By Chapter_

> comicId: string \
> chapter: number \
> chapterId: number

```javascript
Nuxtify.getImages('tham-tu-conan-46391', 1114, 1011493);
```

### _Genres_

```javascript
Nuxtify.getGenres();
```

### _Trending Comics_

> page: number _(option)_

```javascript
Nuxtify.getTrending();
```

### _Recommend Comics_

> type: hot | boy | girl _(option)_

```javascript
Nuxtify.getRecommendComics();
```

### _New Update Comics_

> page: number _(option)_

```javascript
Nuxtify.getNewUpdateComics();
```

### _Completed Comics_

> page: number _(option)_

```javascript
Nuxtify.getCompletedComics();
```

### _Boy Comics_

> page: number _(option)_

```javascript
Nuxtify.getBoyComics();
```

### _Girl Comics_

> page: number _(option)_

```javascript
Nuxtify.getGirlComics();
```

### _New Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getNewComics();
```

### _Comics By Genre_

> genreId: string \
> page: number _(option)_ \
> status: all | finished | updating _(option)_

```javascript
Nuxtify.getComicsByGenre();
```

### _Top Daily_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopDailyComics();
```

### _Top Weekly_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopWeeklyComics();
```

### _Top Monthly_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopMonthlyComics();
```

### _Top Follow Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopFollowComics();
```

### _Top Comment Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopCommentComics();
```

### _Top All Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopAllComics();
```

### _Top Chapter Comics_

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Nuxtify.getTopChapterComics();
```
