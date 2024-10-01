export interface ResponseNewSpace {
  success: boolean;
  error: string | null;
  data: {
    url: string;
    id: string;
    password: string;
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
