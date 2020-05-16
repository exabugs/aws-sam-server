import http, { IncomingMessage, Server, ServerResponse } from 'http';

import _ from 'lodash';
import fs from 'fs';
import path from 'path';
import qs from 'qs';
import yaml from 'aws-yaml';

type ParamsMap = { [key: string]: string };

// Lambda ハンドラー関数
type HandlerType = (
  event: any,
  context: any,
) => Promise<{
  statusCode: number;
  body: any;
  headers: ParamsMap;
}>;

type Module = {
  paths: string[];
  handler: HandlerType;
};

type TargetModule =
  | {
      pathParameters: ParamsMap;
      count: number;
      handler: HandlerType;
    }
  | undefined;

type ModuleMap = {
  [key: string]: Module[];
};

const moduleMap = (dirname: string, Resources: any, config?: any): ModuleMap =>
  _.reduce(
    Resources,
    (m: ModuleMap, v: any) => {
      const { Properties } = v;
      const { CodeUri, Handler, Events } = Properties;
      const [_module, name] = Handler.split('.');
      const module = require(path.join(dirname, CodeUri, _module));
      const handler = module[name];
      // 各モジュールで AWS.config.update を実施
      config && module.config && module.config.update(config);
      return _.reduce(
        Events,
        (m: ModuleMap, v: any) => {
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

const moduleFind = (path: string, modules: Module[]): TargetModule => {
  if (!modules) return;
  const paths1 = path.split('/');
  const hits = [];
  for (const module of _.compact(modules)) {
    const pathParameters: ParamsMap = {};
    let hit = true;
    const paths0 = module.paths;
    for (let i = 0; i < paths0.length; i++) {
      const p = /\{([^}]+)\}/.exec(paths0[i]);
      if (p) {
        pathParameters[p[1]] = paths1[i];
      } else if (paths0[i] !== paths1[i]) {
        hit = false;
      }
    }
    if (hit) {
      const count = paths0.length * 2 - Object.keys(pathParameters).length;
      const { handler } = module;
      hits.push({ handler, pathParameters, count });
    }
  }
  hits.sort((a, b) => (a.count < b.count ? 1 : -1));
  return hits[0];
};

const getBody = async (req: IncomingMessage): Promise<Buffer> =>
  new Promise((resolve, reject) => {
    const buffer: Uint8Array[] = [];
    req.on('data', (data) => buffer.push(data));
    req.on('end', () => {
      return resolve(Buffer.concat(buffer));
    });
    req.on('error', (e: any) => {
      return reject(e);
    });
  });

const serverFunc = (modules: ModuleMap) => async (
  req: IncomingMessage,
  res: ServerResponse,
) => {
  const { method, url } = req;
  if (!method || !url) return;
  const [path, _qs] = url.split('?');

  const tgt = _.concat(modules[method], modules['ANY']);
  const module = moduleFind(path, tgt);

  if (!module) {
    res.writeHead(404);
    res.end();
    return;
  }

  const reqbody = await getBody(req);

  const { handler, pathParameters } = module;
  const event = {
    body: reqbody.toString(),
    path,
    httpMethod: method,
    isBase64Encoded: false,
    queryStringParameters: qs.parse(_qs),
    pathParameters,
    headers: req.headers,
  };
  const context = {};

  const { statusCode, body, headers } = await handler(event, context);
  res.setHeader('Content-Type', 'application/json');
  res.writeHead(statusCode, headers);
  res.end(body);
};

export async function createServer(
  yamlpath: string,
  config?: any, // AWS config
): Promise<http.Server> {
  const buff = await fs.promises.readFile(yamlpath, 'utf8');
  const { Resources } = yaml.load(buff);

  const dirname = path.dirname(path.resolve(yamlpath));

  const modules = moduleMap(dirname, Resources, config);

  return http.createServer(serverFunc(modules));
}

export { Server };
