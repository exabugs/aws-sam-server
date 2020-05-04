# aws-sam-server

## Overview

AWS SAM Local Debug Server.

## How To Install

```
yarn add aws-sam-server
```

## Create Your SAM App

```
$ brew upgrade aws-sam-cli
$ sam init
```

## How To Use

```server.ts
import { createServer } from 'aws-sam-server';

const port = 3456;
const fullpath = `${__dirname}/template.yaml`;

const server = await createServer(fullpath);
const listen = promisify(server.listen.bind(server));
await listen(port);
```

```test.sh
curl http://localhost:3456/hello
```
