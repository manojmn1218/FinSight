// Lightweight request/response types for Vercel Serverless Functions
// avoiding a hard dependency on @vercel/node during local server typechecking.
export interface VercelRequest {
  method?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body?: any;
  query: Record<string, string | string[] | undefined>;
  headers: Record<string, string | string[] | undefined>;
}

export interface VercelResponse {
  status: (statusCode: number) => VercelResponse;
  json: (body: unknown) => VercelResponse;
  send: (body: unknown) => VercelResponse;
  end: () => void;
}

