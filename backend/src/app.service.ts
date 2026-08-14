import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AppEventPayload, AppEvents } from './app.types';


@Injectable()
export class AppService {
  constructor(
    private eventEmitter: EventEmitter2,
  ) { }

  emit(payload: AppEventPayload) {

    this.eventEmitter.emit(AppEvents.APP_ALL, payload);

    this.eventEmitter.emit(payload.event, {
      data: payload.data,
    });

  }
}
