import { User } from "../model/entities/user.entity";

export enum AuthEvents {
    AUTH_ALL = 'auth.*',
    AUTH_USER_LOGGED_IN = 'auth.user_logged_in',
}

export interface AuthLoggedInPayload {
    data: User;
    timestamp: Date;
    event: AuthEvents.AUTH_USER_LOGGED_IN;
}