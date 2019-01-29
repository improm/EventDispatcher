import EventDispatcher from './EventDispatcher';

test('EventDispatcher is exported', () => {
  expect(typeof EventDispatcher).toBe('function');
});

/**
 * Test cases when EventDispatcher has been initialized with api path in config
 */
describe('EventDispatcher initialized with api params test cases', () => {
  const handler: EventDispatcher = new EventDispatcher({
    eventsToPostInSingleCall: 5,
    apiPathToPostEvents: 'http://mockapi.com/',
    eventEnricher: (passedEvent: any) => {
      passedEvent.enrichTestKey = 'enrichTestValue';
      return passedEvent;
    }
  });

  const publicMethodsExpected = ['sendEvent', 'getEventList', 'clearEvents', 'getUUID'];

  afterEach(() => {
    handler.clearEvents();
  });

  runTestSuit(handler, publicMethodsExpected);
});

/**
 * Test cases when EventDispatcher has been initialized with callback in config
 */
describe('EventDispatcher initialized with callback function params test cases', () => {
  const handler: EventDispatcher = new EventDispatcher({
    eventsToPostInSingleCall: 5,
    methodToPostEvents: (data) => {
      return Promise.resolve('DATA_POSTED');
    },
    eventEnricher: (event) => {
      event.enrichTestKey = 'enrichTestValue';
      return event;
    }
  });

  const publicMethodsExpected = ['sendEvent', 'getEventList', 'clearEvents', 'getUUID'];

  afterEach(() => {
    handler.clearEvents();
  });

  runTestSuit(handler, publicMethodsExpected);

  test('EventDispatcher class called methodToPostEvents for submitting data', () => {
    let callBackTriggered = false;
    const submissionChecker: EventDispatcher = new EventDispatcher({
      eventsToPostInSingleCall: 0,
      methodToPostEvents: (data) => {
        callBackTriggered = true;
        return Promise.resolve('DATA_POSTED');
      },
      eventEnricher: (event) => {
        event.enrichTestKey = 'enrichTestValue';
        return event;
      }
    });

    /**
     * This event will be submitted immidiately because eventsToPostInSingleCall === 0
     */
    submissionChecker.sendEvent({
      sampleEvent: true
    });

    submissionChecker.sendEvent({
      sampleEvent: true
    });

    expect(callBackTriggered).toBe(true);
  });
});

/**
 * Common test cases for both types of instantiations
 * with api or with callback
 */
function runTestSuit(handler: EventDispatcher, publicMethodsExpected: string[]) {
  test('EventDispatcher class returns an EventDispatcher object with new keyword', () => {
    expect(typeof handler).toBe('object');
  });

  for (const method of publicMethodsExpected) {
    test(`EventDispatcher object has exposed method ${method}`, () => {
      expect(Object.hasOwnProperty.call(Object.getPrototypeOf(handler), method)).toBe(true);
    });
  }

  test('sendEvent && getEventList method works correctly', () => {
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

  test('getUUID method working correctly', () => {
    expect(typeof handler.getUUID()).toBe('string');
  });

  test('EventDispatcher called eventEnricher and appended extra info', () => {
    handler.sendEvent({
      enricherTest: 1
    });
    const event = handler.getEventList();
    expect(event[0].enrichTestKey).toBe('enrichTestValue');
  });

  test('One EventDispatcher instance is appending same UUID for all events', () => {
    handler.sendEvent({
      sampleEvent: 1
    });

    handler.sendEvent({
      sampleEvent: 2
    });

    const [event1, event2] = handler.getEventList();
    expect(event1.EventDispatcherUuid).toBe(event2.EventDispatcherUuid);
  });

  test('Two EventDispatcher instances have different UUID', () => {
    const handler1 = new EventDispatcher({
      eventsToPostInSingleCall: 5,
      apiPathToPostEvents: 'http://mockapi.com/'
    });

    expect(handler.getUUID() === handler1.getUUID()).toBe(false);
  });
}
