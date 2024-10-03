export interface ResponseNewSpace {
  success: boolean;

  error: string | null;
  data: {
    url: string;
    id: string;
    expressPORT: number | null;
    vitePORT: number | null;
  } | null;
}

export interface UserType {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Containers {
  containerId: string;
  name: string;
  User: UserType;
}

export interface ContainerType {
  containerId: string;
  name?: string;
}
