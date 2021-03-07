import { EventEmitter } from 'events';
import {EVENT_EMITTER_TOKEN} from 'nest-emitter';

// not verified yet
export const eventEmitterMock = {
    provide: EVENT_EMITTER_TOKEN,
    useValue: EventEmitter,
}
