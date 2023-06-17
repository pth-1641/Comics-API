const express = require('express');
const axios = require('axios');

const app = express();

app.get('/', async (req: any, res: any) => {
  try {
    const { host, src } = req.query;
    const options = {
      responseType: 'stream',
      headers: {
        referer: host,
      },
    };
    const response = await axios.get(src, options);
    response.data.pipe(res);
  } catch (err) {
    throw err;
  }
});

app.listen(8080);

setInterval(() => {});
