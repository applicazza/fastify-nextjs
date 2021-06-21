import createFastify from 'fastify';
import fastifyNextJs from '../src';
import axios from 'axios';

describe('Test Fastify NextJS integration', () => {
  it('should start NextJS via Fastify', async () => {
    const basePath = '/foo';
    const dev = process.env.NODE_ENV !== 'production';
    const fastify = createFastify();

    fastify.register(fastifyNextJs, {
      dev,
      basePath,
    });

    try {
      await fastify.after();

      fastify.passNextJsDataRequests();
      fastify.passNextJsDevRequests();
      fastify.passNextJsPageRequests();

      const url = await fastify.listen(0);

      expect(fastify.server.address()).not.toBeNull();
      expect(fastify.nextServer).not.toBeNull();

      const response = await axios.get(`${url}/foo`);

      expect(response.status).toBe(200);

      expect(response.data).toContain('req-1');
    } finally {
      fastify.close();
    }
  });
});
