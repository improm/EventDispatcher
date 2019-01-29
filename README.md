# EventDispatcher

Process events, post events to server in batch, enrich events by appendig additonal data using simple configuration.
Persists events in case of browser reload, or quitting. Uses local storage.

## Usage

EventDispatcher has two modes. One with `apiPathToPostEvents` and second with `methodToPostEvents`.

### using `apiPathToPostEvents`

If you want eventDispatcher to handle posting of events for you. Just provide the api path ,a post request will be
triggered automatically to that url with data.

```javascript
import EventDispatcher from 'EventDispatcher';

const eventDispatcher = new EventDispatcher({
  eventsToPostInSingleCall: 10,
  apiPathToPostEvents: 'http://apiToPostData.com/'
});

eventDispatcher.sendEvent({
  eventType: 'click',
  buttonName: 'ADD_TO_CART'
});

eventDispatcher.sendEvent({
  eventType: 'scroll',
  pageName: 'MY_PROFILE'
});
```

Handler will save 10 events and automatically post event data to the api http://apiToPostData.com/ on every 11th event.

### using `methodToPostEvents`

If you want to handle posting of events yourself. Pass a callback `methodToPostEvents` and it will be called
automatically after `eventsToPostInSingleCall` no of events.

```javascript
import EventDispatcher from 'EventDispatcher';

const eventDispatcher = new EventDispatcher({
  eventsToPostInSingleCall: 5,
  methodToPostEvents: (data) => {
    // Your implementation here
    return fetch('http://backendapi.com/', {
      body: JSON.stringify(data),
      headers: {
        customHeaders: 'value'
      },
      method: 'POST'
    });
  }
});

eventDispatcher.sendEvent({
  eventType: 'OPENED_POPUP'
});
```

## Advance usage

Encapsulate the EventDispatcher in a global service and use that service in your application code.

```javascript
import EventDispatcher from 'EventDispatcher';

export class EventDispatcherService {
  eventDispatcher;

  constructor() {
    this.eventDispatcher = new EventDispatcher({
      eventsToPostInSingleCall: 5,
      eventEnricher: this.eventEnricher,
      methodToPostEvents: this.sendEvents,
      storageKeyPrefix: 'application_id_user_id'
    });
  }

  sendEvent(events) {
    return this.eventDispatcher.sendEvent(events);
  }

  // called every time sendEvent function is called
  // append application specific global data to each event in this function
  eventEnricher(event) {
    return { ...event, userId: 'user_id_of_loggedin_user' };
  }
}
```

Depending on the use case, use might like to use single instance of `EventDispatcherService` in your whole application.
Then use this instance in your whole application. For any global changes in future, you only need to modify
EventDispatcherService and not your whole application code.

```javascript
const eventService = new EventDispatcherService();

eventService.sendEvent({
  eventType: 'OPENED_POPUP'
});
```

## Supported Config

| Name                     | Type                  | Required | Description                                                                                                                                    |
| ------------------------ | --------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| eventsToPostInSingleCall | `number`              | true     | Wait for these many events before posting events to `apiPathToPostEvents` or triggering `methodToPostEvents`                                   |
| eventEnricher            | `IEventEnricher`      | false    | This function is triggered every time send event is called, can be used to append additonal data to each event.                                |
| apiPathToPostEvents      | `string`              | false    | absolute url, to which event should be posted (eg. http://api.com)                                                                             |
| methodToPostEvents       | `IMethodToPostEvents` | false    | This function is triggered when after sendEvent method has been called `eventsToPostInSingleCall` times atleast                                |
| storageKeyPrefix         | `string`              | false    | Appended to the keyName used to save events in localstorage, Provide something unique to prevent conflict across applications / multiple users |

## Supported methods

'sendEvent', 'getEventList', 'clearEvents', 'getUUID'

| Name         | arguments in order                                          | Description                                                                                                                                                                                                                                                                   |
| ------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| sendEvent    | eventToSend: IEvent; forceful = false; consoleEvent = false | `eventToSend`: event data; `forceful`: ignore the check for `eventsToPostInSingleCall` and call `methodToPostEvents` or `apiPathToPostEvents` immidiately; `consoleEvent`: console.log the event being sent to `eventToSend` method. Called after `eventEnricher` if provided |
| getEventList | no arguments                                                | Returns the events currently present with eventDispatcher instance                                                                                                                                                                                                            |
| clearEvents  | no arguments                                                | Clear the events currently present with eventDispatcher instance                                                                                                                                                                                                              |
| getUUID      | no arguments                                                | Each EventDispatcher instance gets a unique UUID, use this method to get the                                                                                                                                                                                                  |
