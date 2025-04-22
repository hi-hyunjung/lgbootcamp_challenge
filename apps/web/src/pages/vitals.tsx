import { GetServerSideProps } from 'next';

type Metric = {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  timestamp: string;
  path: string;
};

const vitals: Metric[] = [];

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  if (req.method === 'POST') {
    const buffers: Buffer[] = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const body = Buffer.concat(buffers).toString();
    const { name, value, rating, delta, path } = JSON.parse(body);

    const metric = {
      name,
      value,
      rating,
      delta,
      timestamp: new Date().toISOString(),
      path,
    };

    vitals.push(metric);
    console.log('metric:', metric);

    res.statusCode = 200;
    res.end(JSON.stringify({ status: 'ok' }));
    return { props: {} };
  }

  // GET 요청: 로그 페이지 렌더
  return {
    props: {
      vitals,
    },
  };
};

export default function VitalsPage({ vitals }: { vitals: Metric[] }) {
  return (
    <div style={{ padding: 20, fontFamily: 'sans-serif' }}>
      <h1>Web Vitals Logs</h1>
      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Name</th>
            <th>Value</th>
            <th>Rating</th>
            <th>Delta</th>
            <th>Path</th>
          </tr>
        </thead>
        <tbody>
          {vitals.map((v, i) => (
            <tr key={i}>
              <td>{v.timestamp}</td>
              <td>{v.name}</td>
              <td>{v.value}</td>
              <td>{v.rating ?? '-'}</td>
              <td>{v.delta ?? '-'}</td>
              <td>{v.path ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
