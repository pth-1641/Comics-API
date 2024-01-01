import express from 'express';
import v1 from './version/v1/api';
import v2 from './version/v2/api';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 8080;

// app.use(require('cors')());

// Versions
app.use('/', cors(), v1);
app.use(
  '/v2',
  cors({
    origin: ['http://ncomics.onrender.com'],
    optionsSuccessStatus: 200,
  }),
  v2
);

app.get('/', (req, res) => {
  res.json({
    Github: 'https://github.com/pth-1641/Comics-API',
    Issues: 'https://github.com/pth-1641/Comics-API/issues',
    'Official Website': 'https://ncomics.onrender.com',
  });
});

// Handle 404
app.use((req, res) => {
  res.json({
    status: 404,
    message: 'Not Found',
  });
});

app.listen(PORT);
