export interface ProtheusTokenResponseSuccess {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
}

export type ProtheusTokenResponse = ProtheusTokenResponseSuccess | string;

export interface ProtheusUserIdResponse {
  userID: string;
}

export interface ProtheusEmailObject {
  value: string;
  type: string;
  primary?: boolean;
}

export interface ProtheusGroupObject {
  value: string;
  display?: string;
}

export interface ProtheusManagerObject {
  value: string;
  displayName?: string;
}

export interface ProtheusUserDetailsResponse {
  id: string;
  userName: string;
  displayName: string;
  emails: ProtheusEmailObject[];
  active?: boolean;
  department?: string;
  title?: string;
  manager?: ProtheusManagerObject;
  groups?: ProtheusGroupObject[];
  externalId?: string;
  name?: {
    givenName?: string;
    familyName?: string;
    formatted?: string;
  };
}

export interface UserInfo {
  id: string;
  username: string;
  name: string;
  email: string;
  department?: string;
  isActive: boolean;
  isAdmin: boolean;
  protheusUserId: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: UserInfo;
}
