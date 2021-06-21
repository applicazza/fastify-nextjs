import { FC } from 'react';
import { GetServerSideProps } from 'next';

interface Props {
    foo: string;
}

const Page: FC<Props> = ({ foo }) => {
  return <>
    <pre>{foo}</pre>
  </>;
};

export const getServerSideProps: GetServerSideProps<Props> = async ({ req }) => {
  return {
    props: {
      foo: req.fastify.id,
    }
  };
};

export default Page;
