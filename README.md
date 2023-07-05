# Comics API

Vietnamese Comics API for client using scraping technique

## ⚠️ Unofficial API from [Nettruyen](https://nettruyen.com)

## ⚡ Using for client [here](https://github.com/pth-1641/Comics-API/blob/master/api/README.md)

## **I. Installation**

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

## **II. Usage**

### **Chapters**

> comicId: string

```javascript
Comics.getChapters('tham-tu-conan');
```

### **Comments**

> chapter: string \
> page: number _(option)_ \
> sortBy: default | newest _(option)_

```javascript
Comics.getComments('tham-tu-conan');
```

### **Search Comics**

> query: string \
> page: number _(option)_

```javascript
Comics.searchComics('conan');
```

### **Search Suggestion**

> query: string

```javascript
Comics.getSearchSuggest('conan');
```

### **Comic Detail**

> comicId: string

```javascript
Comics.getComicDetail('tham-tu-conan');
```

### **Single Chapter**

> comicId: string \
> chapterId: number

```javascript
Comics.getChapter('tham-tu-conan', 1011493);
```

### **Genres**

```javascript
Comics.getGenres();
```

### **Trending Comics**

> page: number _(option)_

```javascript
Comics.getTrending();
```

### **Recommend Comics**

> type: hot | boy | girl _(option)_

```javascript
Comics.getRecommendComics();
```

### **New Update Comics**

> page: number _(option)_

```javascript
Comics.getNewUpdateComics();
```

### **Completed Comics**

> page: number _(option)_

```javascript
Comics.getCompletedComics();
```

### **Boy Comics**

> page: number _(option)_

```javascript
Comics.getBoyComics();
```

### **Girl Comics**

> page: number _(option)_

```javascript
Comics.getGirlComics();
```

### **New Comics**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getNewComics();
```

### **Comics By Genre**

> genreId: string \
> page: number _(option)_ \
> status: all | finished | updating _(option)_

```javascript
Comics.getComicsByGenre();
```

### **Top Daily**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopDailyComics();
```

### **Top Weekly**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopWeeklyComics();
```

### **Top Monthly**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopMonthlyComics();
```

### **Top Follow Comics**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopFollowComics();
```

### **Top Comment Comics**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopCommentComics();
```

### **Top All Comics**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopAllComics();
```

### **Top Chapter Comics**

> status: all | finished | updating _(option)_ \
> page: number _(option)_

```javascript
Comics.getTopChapterComics();
```
