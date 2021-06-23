import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fastifyPlugin from 'fastify-plugin';
import { IncomingMessage, ServerResponse } from 'http';
import Next from 'next';
import { NextServer } from 'next/dist/server/next';
import fastifyStatic from 'fastify-static';

declare module 'fastify' {
    // eslint-disable-next-line no-unused-vars
    // noinspection JSUnusedGlobalSymbols
    interface FastifyInstance {
        nextJsProxyRequestHandler: (request: FastifyRequest, reply: FastifyReply) => void;
        nextJsRawRequestHandler: (request: FastifyRequest, reply: FastifyReply) => void;
        nextServer: NextServer;
        passNextJsRequests: () => void;
        passNextJsDataRequests: () => void;
        passNextJsDevRequests: () => void;
        passNextJsPageRequests: () => void;
        passNextJsStaticRequests: () => void;
    }
}

declare module 'http' {

    // eslint-disable-next-line no-unused-vars
    interface IncomingMessage {
        fastify: FastifyRequest;
    }

    // eslint-disable-next-line no-unused-vars
    interface OutgoingMessage {
        fastify: FastifyReply;
    }
}

export interface FastifyNextJsOptions {
    dev?: boolean;
    basePath?: string;
}

const fastifyNextJs: FastifyPluginAsync<FastifyNextJsOptions> = async (fastify, { dev, basePath = '' }) => {
  if (dev === undefined) {
    dev = process.env.NODE_ENV !== 'production';
  }

  const nextServer = Next({
    dev,
  });

  const nextRequestHandler = nextServer.getRequestHandler();

  const passNextJsRequestsDecorator = () => {
    fastify.passNextJsDataRequests();

    if (dev) {
      fastify.passNextJsDevRequests();
    } else {
      fastify.passNextJsStaticRequests();
    }

    fastify.passNextJsPageRequests();

  };

  const passNextJsDataRequestsDecorator = () => {
    fastify.get(`${basePath}/_next/data/*`, nextJsProxyRequestHandler);
  };

  const passNextJsDevRequestsDecorator = () => {
    fastify.all(`${basePath}/_next/*`, nextJsRawRequestHandler);
  };

  const passNextJsStaticRequestsDecorator = () => {
    fastify.register(fastifyStatic, {
      prefix: '${basePath}/_next/static/',
      root: `${process.cwd()}/.next/static`,
      decorateReply: false,
    });
  };

  const passNextJsPageRequestsDecorator = () => {
    if (basePath) {
      fastify.all(`${basePath}`, nextJsProxyRequestHandler);
    }
    fastify.all(`${basePath}/*`, nextJsProxyRequestHandler);
  };
  fastify.decorate('passNextJsRequests', passNextJsRequestsDecorator);
  fastify.decorate('passNextJsDataRequests', passNextJsDataRequestsDecorator);
  fastify.decorate('passNextJsDevRequests', passNextJsDevRequestsDecorator);
  fastify.decorate('passNextJsStaticRequests', passNextJsStaticRequestsDecorator);
  fastify.decorate('passNextJsPageRequests', passNextJsPageRequestsDecorator);
  fastify.decorate('nextServer', nextServer);

  const nextJsProxyRequestHandler = function (request: FastifyRequest, reply: FastifyReply) {
    nextRequestHandler(proxyFastifyRawRequest(request), proxyFastifyRawReply(reply));
  };

  const nextJsRawRequestHandler = function (request: FastifyRequest, reply: FastifyReply) {
    nextRequestHandler(request.raw, reply.raw);
  };

  fastify.decorate('nextJsProxyRequestHandler', nextJsProxyRequestHandler);
  fastify.decorate('nextJsRawRequestHandler', nextJsRawRequestHandler);

  fastify.addHook('onClose', function () {
    return nextServer.close();
  });

  await nextServer.prepare();
};

const proxyFastifyRawRequest = (request: FastifyRequest) => {
  return new Proxy(request.raw, {
    get(target: IncomingMessage, property: string | symbol, receiver: unknown): unknown {
      const value = Reflect.get(target, property, receiver);

      if (typeof value === 'function') {
        return value.bind(target);
      }

      if (property === 'fastify') {
        return request;
      }

      return value;
    }
  });
};

const proxyFastifyRawReply = (reply: FastifyReply) => {
  return new Proxy(reply.raw, {
    get: function (target: ServerResponse, property: string | symbol, receiver: unknown): unknown {
      const value = Reflect.get(target, property, receiver);

      if (typeof value === 'function') {
        if (value.name === 'end') {
          return function () {
            return reply.send(arguments[0]);
          };
        }
        if (value.name === 'getHeader') {
          return function () {
            return reply.getHeader(arguments[0]);
          };
        }
        if (value.name === 'hasHeader') {
          return function () {
            return reply.hasHeader(arguments[0]);
          };
        }
        if (value.name === 'setHeader') {
          return function () {
            return reply.header(arguments[0], arguments[1]);
          };
        }
        if (value.name === 'writeHead') {
          return function () {
            return reply.status(arguments[0]);
          };
        }
        return value.bind(target);
      }

      if (property === 'fastify') {
        return reply;
      }

      return value;
    },
  });
};

export default fastifyPlugin(fastifyNextJs, {
  fastify: '3.x',
});
