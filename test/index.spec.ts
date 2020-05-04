import { Server, createServer } from '../src/index';

import _ from 'lodash';
import axios from 'axios';

const port = 3456;
const baseURL = `http://localhost:${port}`;

describe('manage_arm', () => {
  let server: Server;
  beforeEach(async () => {
    const fullpath = `${__dirname}/template.yaml`;
    server = await createServer(fullpath);
    await new Promise((resolve) => server.listen(port, resolve));
  });

  afterEach(() => {
    server.close();
  });

  test('GET', async () => {
    const client = axios.create({ baseURL, method: 'GET' });

    const params = { q: 'keyword' };
    const res1 = await client({ url: '/hello', params });
    expect(res1.data.queryStringParameters).toEqual(params);
    expect(res1.status).toEqual(200);

    const res2 = await client({ url: '/hello/AAA' });
    expect(res2.data.pathParameters).toEqual({ name: 'AAA' });
    expect(res2.status).toEqual(200);
  });

  test('POST', async () => {
    const client = axios.create({ baseURL, method: 'POST' });

    const data = { first: 'hello', last: 'world' };
    const params = { q: 'keyword' };
    const res = await client({ url: '/hello', data, params });
    expect(res.data.queryStringParameters).toEqual(params);
    expect(res.data.body).toEqual(JSON.stringify(data));
  });
});
