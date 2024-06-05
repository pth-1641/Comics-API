# Comics API

Vietnamese Comics API using scrape technique.

## ❌ Don't use this to crawl image!

### **Base URL**: https://comics-api.vercel.app

## Usage

### **Trending**

```ts
page: number; // option

path: `/trending-comics?page=${page}`;
```

### **Genres**

```ts
path: "/genres";
```

### **Comics By Genre**

```ts
genre_id: string;
page: number; // option
status: "all" | "completed" | "ongoing"; // option

path: `/genres/${genre_id}`;
```

### **Search**

```ts
query: string;
page: number; // option

path: `/search?q=${query}&page=${page}`;
```

### **Search Suggest**

```ts
query: string;

path: `/search-suggest?q=${query}`;
```

### **Recommend Comics**

```ts
path: "/recommend-comics";
```

### **New Comics**

```ts
page: number; // option

status: "all" | "completed" | "ongoing"; // option

path: `/new-comics?page=${page}&status=${status}`;
```

### **Recent Update Comics**

```ts
page: number; // option
status: "all" | "completed" | "ongoing"; // option

path: `/recent-update-comics?page=${page}&status=${status}`;
```

### ~~**Boy Comics**~~

```ts
page: number; // option

path: `/boy-comics?page=${page}`;
```

### ~~**Girl Comics**~~

```ts
page: number; // option

path: `/girl-comics?page=${page}`;
```

### **Completed Comics**

```ts
page: number; // option

path: `/completed-comics?page=${page}`;
```

### **Comic Detail**

```ts
comic_id: string;

path: `/comics/${comic_id}`;
```

### **Comic Chapters**

```ts
comic_id: string;

path: `/comics/${comic_id}/chapters`;
```

### **Single Chapter**

```ts
comic_id: string;
chapter_id: number;

path: `/comics/${comic_id}/chapters/${chapter_id}`;
```

### **Top**

```ts
page: number; // option
status: "all" | "completed" | "ongoing"; // option

// Paths
All: `/top?page=${page}&status=${status}`;
Daily: `/top/daily?page=${page}&status=${status}`;
Weekly: `/top/weekly?page=${page}&status=${status}`;
Monthly: `/top/monthly?page=${page}&status=${status}`;
Chapter: `/top/chapter?page=${page}&status=${status}`;
Follow: `/top/follow?page=${page}&status=${status}`;
Comment: `/top/comment?page=${page}&status=${status}`;
```
