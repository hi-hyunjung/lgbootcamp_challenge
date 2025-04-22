import { NextApiRequest, NextApiResponse } from 'next';

// Web Vitals metric 타입 정의
type WebVitalMetric = {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  timestamp: string;
};

// 서버 메모리에 메트릭을 저장할 배열
const vitals: WebVitalMetric[] = [];

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { name, value, rating, delta } = req.body;

    const metric: WebVitalMetric = {
      name,
      value,
      rating,
      delta,
      timestamp: new Date().toISOString(),
    };

    vitals.push(metric);
    console.log('metric : ', metric);
    return res.status(200).json({ status: 'ok' });
  }

  if (req.method === 'GET') {
    const html = `
      <html>
        <head>
          <title>Web Vitals Logs</title>
          <style>
            body { font-family: sans-serif; padding: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #ccc; padding: 8px; }
            th { background-color: #f4f4f4; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Web Vitals Logs</h1>
          <table>
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Name</th>
                <th>Value</th>
                <th>Rating</th>
                <th>Delta</th>
              </tr>
            </thead>
            <tbody>
              ${vitals
                .map(
                  (v) => `
                <tr>
                  <td>${v.timestamp}</td>
                  <td>${v.name}</td>
                  <td>${v.value}</td>
                  <td>${v.rating ?? '-'}</td>
                  <td>${v.delta ?? '-'}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    res.setHeader('Content-Type', 'text/html');
    res.status(200).end(html);
    return;
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
