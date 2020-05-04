import http, { IncomingMessage, Server, ServerResponse } from 'http';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import qs from 'qs';
import yaml from 'aws-yaml';

const moduleMap = (dirname: string, Resources: any) =>
  _.reduce(
    Resources,
    (m: any, v: any) => {
      const { Properties } = v;
      const { CodeUri, Handler, Events } = Properties;
      const [module, name] = Handler.split('.');
      const handler = require(path.join(dirname, CodeUri, module))[name];
      return _.reduce(
        Events,
        (m: any, v: any) => {
          const { Properties } = v;
          const { Path, Method } = Properties;
          const method = Method.toUpperCase();
          m[method] = m[method] || [];
          m[method].push({
            paths: Path.split('/'),
            handler,
          });
          return m;
        },
        m,
      );
    },
    {},
  );

const moduleFind = (path: string, modules: any) => {
  if (!modules) return;
  const paths1 = path.split('/');
  const hits = [];
  for (const module of modules) {
    const params: { [key: string]: string } = {};
    let hit = true;
    const paths0 = module.paths;
    for (let i = 0; i < paths0.length; i++) {
      const p = /\{([^}]+)\}/.exec(paths0[i]);
      if (p) {
        params[p[1]] = paths1[i];
      } else if (paths0[i] !== paths1[i]) {
        hit = false;
      }
    }
    if (hit) {
      const count = paths0.length * 2 - Object.keys(params).length;
      const { handler } = module;
      hits.push({ handler, params, count });
    }
  }
  hits.sort((a, b) => (a.count < b.count ? 1 : -1));
  return hits[0];
};

const getBody = async (req: IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const data: any[] = [];
    req.on('data', (chunk: any) => data.push(chunk));
    req.on('end', () => {
      return resolve(Buffer.concat(data));
    });
    req.on('error', (e: any) => {
      return reject(e);
    });
  });

const serverFunc = (modules: any) => async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  const { method = '', url = '' } = req;
  const [path, _qs] = url.split('?');

  const module = moduleFind(path, modules[method]);

  if (!module) {
    res.writeHead(404);
    res.end();
    return;
  }

  const reqbody = await getBody(req);

  const { handler, params } = module;
  const event = {
    body: reqbody.toString(),
    path,
    httpMethod: method,
    isBase64Encoded: false,
    queryStringParameters: qs.parse(_qs),
    pathParameters: params,
    headers: req.headers,
  };
  const context = {};

  const { statusCode, body, headers } = await handler(event, context);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode, headers);
  res.end(body);
};

export async function createServer(yamlpath: string): Promise<http.Server> {
  const buff = await fs.promises.readFile(yamlpath, 'utf8');
  const { Resources } = yaml.load(buff);

  const dirname = path.dirname(path.resolve(yamlpath));

  const modules = moduleMap(dirname, Resources);

  return http.createServer(serverFunc(modules));
}

export { Server };
