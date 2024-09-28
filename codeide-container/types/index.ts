export interface ResponseNewSpace {
  success: boolean;
  error: string | null;
  data: {
    url: string;
    id: string;
    password: string;
  } | null;
}
