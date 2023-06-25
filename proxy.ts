const express = require('express');
const axios = require('axios');

const app = express();

app.get('/', async (req: any, res: any) => {
  try {
    const { src } = req.query;
    const options = {
      responseType: 'stream',
      headers: {
        referer: 'https://www.nettruyen.com',
      },
    };
    const response = await axios.get(src, options);
    response.data.pipe(res);
  } catch (err) {
    throw err;
  }
});

app.listen(process.env.PORT || 8080);

// Request to prevent server sleeping
setInterval(
  () => {
    axios.get('https://api-comics-9g0r.onrender.com/?src=https://picsum.photos/1');
  },
  870000 // 14m30s
);
