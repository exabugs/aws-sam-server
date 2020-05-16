import { Server, createServer } from '../src/index';

import AWS from 'aws-sdk';
import _ from 'lodash';
import axios from 'axios';
import { promisify } from 'util';

describe('template.yaml', () => {
  const path = `${__dirname}/template.yaml`;
  const port = process.env.PORT || 3456;
  const baseURL = `http://localhost:${port}`;
  let server: Server;

  beforeAll(async () => {
    const getCredentials = promisify(
      AWS.config.getCredentials.bind(AWS.config),
    );
    const config = await getCredentials();

    server = await createServer(path, config);
    const listen = promisify(server.listen.bind(server));
    await listen(port);
  });

  afterAll(() => {
    server.close();
  });

  describe('GET', () => {
    const client = axios.create({ baseURL, method: 'GET' });

    test('GET', async () => {
      const params = { q: 'keyword' };
      const res = await client({ url: '/hello', params });
      expect(res.data.queryStringParameters).toEqual(params);
      expect(res.status).toEqual(200);
    });

    test('GET', async () => {
      const res = await client({ url: '/hello/AAA' });
      expect(res.data.pathParameters).toEqual({ name: 'AAA' });
      expect(res.status).toEqual(200);
    });
  });

  describe('POST', () => {
    const client = axios.create({ baseURL, method: 'POST' });

    test('POST', async () => {
      const data = { first: 'hello', last: 'world' };
      const params = { q: 'keyword' };
      const res = await client({ url: '/hello', data, params });
      expect(res.data.queryStringParameters).toEqual(params);
      expect(res.data.body).toEqual(JSON.stringify(data));
    });

    test('ANY', async () => {
      const data = { first: 'hello', last: 'world' };
      const params = { q: 'keyword' };
      const res = await client({ url: '/hello2', data, params });
      expect(res.data.queryStringParameters).toEqual(params);
      expect(res.data.body).toEqual(JSON.stringify(data));
    });
  });

  describe('PUT', () => {
    const client = axios.create({ baseURL, method: 'PUT' });

    test('ANY', async () => {
      const data = { first: 'hello', last: 'world' };
      const params = { q: 'keyword' };
      const res = await client({ url: '/hello2', data, params });
      expect(res.data.queryStringParameters).toEqual(params);
      expect(res.data.body).toEqual(JSON.stringify(data));
    });
  });
});
