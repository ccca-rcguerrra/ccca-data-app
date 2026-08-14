

export enum AppEvents {
    APP_ALL = 'app.*',
}


export interface AppEventPayload<T = string> {
    event: T;
    data?: any;
    toSocketClients?: string[] | 'all';
    toSocketRooms?: string[] | 'all';
    toSocketUsers?: string[] | 'all';
}
