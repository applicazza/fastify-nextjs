# @applicazza/fastify-nextjs

`@applicazza/fastify-nextjs` is a plugin for serving [Next.js](https://nextjs.org) requests
via [Fastify](https://github.com/fastify/fastify).

[![npm](https://img.shields.io/npm/v/@applicazza/fastify-nextjs)](https://www.npmjs.com/package/@applicazza/fastify-nextjs) [![codecov](https://codecov.io/gh/applicazza/fastify-nextjs/branch/main/graph/badge.svg?token=CCVDPRT9MT)](https://codecov.io/gh/applicazza/fastify-nextjs)

**This project is yet to reach stable state. You may help by contributing and testing it.**

## Why

Original [fastify-nextjs](https://github.com/fastify/fastify-nextjs) doesn't pass response through Fastify's pipeline thus hooks that you may need won't work. This package is using JavaScript's [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to intercept calls to NodeJs [http.ServerResponse](https://nodejs.org/api/http.html#http_class_http_serverresponse) and pass it to Fastify.

## Usage

Add dependencies

```shell
yarn add @applicazza/fastify-nextjs
yarn add fastify-static
```

Default example

```ts
import createFastify from 'fastify';
import fastifyNextJs from '@applicazza/fastify-nextjs';

const dev = process.env.NODE_ENV !== 'production';

const fastify = createFastify();

fastify.register(fastifyNextJs, {
    dev,
});

await fastify.after();

fastify.passNextJsRequests();

await fastify.listen(0);
```

Extended example

```ts
import createFastify from 'fastify';
import fastifyNextJs from '@applicazza/fastify-nextjs';

const dev = process.env.NODE_ENV !== 'production';

const fastify = createFastify();

fastify.register(fastifyNextJs, {
    dev,
});

await fastify.after();

fastify.passNextJsDataRequests();
if (dev) {
    fastify.passNextJsDevRequests();
} else {
    fastify.passNextJsStaticRequests();
}
fastify.passNextJsPageRequests();

await fastify.listen(0);
```

Plugin accepts following options:

```ts
interface FastifyNextJsOptions {
    dev?: boolean;
    basePath?: string;
}
```

Plugin augments fastify instance with following properties and methods:

```ts
interface FastifyInstance {
    nextServer: NextServer;
    passNextJsRequests: () => void;
    passNextJsDataRequests: () => void;
    passNextJsDevRequests: () => void;
    passNextJsPageRequests: () => void;
    passNextJsStaticRequests: () => void;
}
```

## Building from source

```shell
yarn build
```

## Testing

```shell
yarn test
```

## License

Licensed under [MIT](./LICENSE.md).
