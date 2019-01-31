import EventDispatcher, { IEvent } from './index';
const globalAny: any = global;
let eventsToPostInSingleCall = 3;

const isLocalStorageAvailable = () => {
  return !!(typeof window === 'object' && typeof window.localStorage === 'object');
};

if (isLocalStorageAvailable()) {
  localStorage.setItem(
    'event_test',
    JSON.stringify([
      {
        key: 'value'
      }
    ])
  );
  eventsToPostInSingleCall--;
}

class EventDispatcherTest extends EventDispatcher {
  constructor() {
    super({
      eventsToPostInSingleCall
    });
  }

  public getLocalStorageKeyName() {
    return 'event_test';
  }

  public eventEnricher(passedEvent: any) {
    passedEvent.enrichTestKey = 'enrichTestValue';
    return passedEvent;
  }

  public getStorageKeyPrefix(): string {
    return '123';
  }

  public methodToPostEvents(data: IEvent[]): Promise<any> {
    return fetch('http://mockapi.com/postevent', {
      body: JSON.stringify(data),
      headers: {
        Accep: 'application/json',
        'Content-Type': 'application/json'
      },
      method: 'POST'
    });
  }
}

const handler: EventDispatcher = new EventDispatcherTest();
try {
  handler.clearEvents();
  eventsToPostInSingleCall++;
} catch (err) {
  console.log('unable to clear events already in local storage. Some test depending on count might fail');
}

afterEach(() => {
  handler.clearEvents();
});

test('EventDispatcher is exported', () => {
  expect(typeof EventDispatcher).toBe('function');
});

test('sendEvent method works correctly', () => {
  let works = false;
  try {
    handler.sendEvent(
      {
        postEventTestId: 12345
      },
      false,
      true
    );
    works = true;
  } catch (err) {
    works = false;
  }
  expect(works).toBe(true);
});

test('forceFlag works in sendEvent,  and methodToPostEvents is called', () => {
  let dataPostedViaFetch: any;

  globalAny.fetch = jest.fn().mockImplementation((apiName) => {
    return new Promise((resolve, reject) => {
      dataPostedViaFetch = apiName;
      resolve({
        ok: true
      });
    });
  });

  handler.sendEvent(
    {
      checkingPostWasCalled: 1
    },
    true
  );
  expect(dataPostedViaFetch).toBe('http://mockapi.com/postevent');
});

test('getEventList method works correctly', () => {
  handler.sendEvent({
    postEventTestId: 12345
  });
  const event = handler.getEventList();
  expect(event[0].postEventTestId).toBe(12345);
});

test('clearEvents method working correctly', () => {
  handler.sendEvent({
    enricherTest: 1
  });
  handler.clearEvents();
  const eventList = handler.getEventList();
  expect(eventList.length).toBe(0);
});

test('Submitting more events then eventsToPostInSingleCall causes an empty queue', () => {
  handler.sendEvent({
    enricherTest: 1
  });
  handler.sendEvent({
    enricherTest: 2
  });
  handler.sendEvent({
    enricherTest: 3
  });
  const eventList = handler.getEventList();
  expect(eventList.length).toBe(1);
});

test('getSessionUUID method working correctly', () => {
  expect(typeof handler.getUUID()).toBe('string');
});

test('EventDispatcher called eventEnricher', () => {
  handler.sendEvent({
    sampleEvent: 1
  });
  const event = handler.getEventList();
  expect(event[0].enrichTestKey).toBe('enrichTestValue');
});

test('One EventDispatcher instance is appending same UUID for all events', () => {
  console.log(handler.getEventList(), '_________________');
  handler.sendEvent({
    enricherTest: 1
  });
  handler.sendEvent({
    enricherTest: 2
  });
  const [event1, event2] = handler.getEventList();
  expect(event1.eventDispatcherUuid).toBe(event2.eventDispatcherUuid);
});

test('Two EventDispatcher instances have different UUID', () => {
  const handler1 = new EventDispatcherTest();
  expect(handler.getUUID() === handler1.getUUID()).toBe(false);
});
