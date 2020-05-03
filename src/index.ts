import _ from 'lodash';
import fs from 'fs';
import http from 'http';
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

const getBody = async (req: any) =>
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

const serverFunc = (modules: any) => async (req: any, res: any) => {
  const { method, url } = req;
  const [path, _qs] = url.split('?');

  const module = moduleFind(path, modules[method]);

  if (!module) {
    res.writeHead(404);
    res.end();
    return;
  }

  let json;
  try {
    const reqbody: any = await getBody(req);
    json = JSON.parse(reqbody.toString());
  } catch (e) {
    res.writeHead(400);
    res.end();
    return;
  }

  const { handler, params } = module;
  const event = {
    body: json,
    path,
    httpMethod: method,
    isBase64Encoded: false,
    queryStringParameters: qs.parse(_qs),
    pathParameters: params,
    headers: req.headers,
  };
  const context = {};

  const { statusCode, body, headers } = await handler(event, context);
  const defaultHeaders = { 'Content-Type': 'application/json' };
  const h = Object.assign(defaultHeaders, headers);
  res.writeHead(statusCode, h);
  res.end(body);
};

async function createServer(yamlpath: string) {
  const buff = await fs.promises.readFile(yamlpath, 'utf8');
  const { Resources } = yaml.load(buff);

  const dirname = path.dirname(path.resolve(yamlpath));

  const modules = moduleMap(dirname, Resources);

  return http.createServer(serverFunc(modules));
}

export default { createServer };
