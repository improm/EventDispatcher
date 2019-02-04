# EventDispatcher

[![Build Status](https://travis-ci.org/improm/EventDispatcher.svg?branch=master)](https://travis-ci.org/improm/EventDispatcher) [![Language grade: JavaScript](https://img.shields.io/lgtm/grade/javascript/g/improm/EventDispatcher.svg?logo=lgtm&logoWidth=18)](https://lgtm.com/projects/g/improm/EventDispatcher/context:javascript) [![Coverage Status](https://coveralls.io/repos/github/improm/EventDispatcher/badge.svg?branch=master)](https://coveralls.io/github/improm/EventDispatcher?branch=master) [![code style: prettier](https://badgen.now.sh/badge/code%20style/prettier/ff69b4)](https://github.com/prettier/prettier)

Process events, post events to server in batch, enrich events by appendig additonal data using simple configuration.
Persists events in case of browser reload, closing the browser window (local storage used).

## Usage

Install it as a dev dependency in your project.

``` javasctipt
npm install --save uieventdispatcher
```

 Create a class `EventDispatcherService` in your codebase that extends `EventDispatcher`. Just use the code below and modify according to your needs. 

```javascript
// EventDispatcherService.js
import EventDispatcher from "uieventdispatcher";

export class EventDispatcherService extends EventDispatcher {
  constructor() {
    super({
      eventsToPostInSingleCall: 1
    });
  }

  eventEnricher(event) {
    // attach addtional data to each  event if needed
    event.userId = '1KL';
    // dont miss out returning the event back
    return event;
  }

  methodToPostEvents(data) {
    // Replcae the url with url of your backend api where you want to submit events
    return fetch("http://backend-url.com/api/analytics", {
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json"
      },
      method: "POST"
    });
  }

  getLocalStorageKeyName(){
    //  Provide a unique name here. Something constant for an user. 
    // Dont use timestamp for eg. 
    return 'APP_NAME'+ 'userIdIfYouHave';
  }
}

// Expose the same instance to your whole application 
const eventDispatcher = new EventDispatcherService();
export default eventDispatcher;

```

Then use this service in rest of your application code. Now you just need to use `sendEvent` method. Rest will be handled by `EventDispatcherService`.

``` javascript
import eventDispatcher from 'EventDispatcherService';

eventDispatcher.sendEvent({ page: 1});

eventDispatcher.getEventList(); 
/** output
  
  [ { page: 1,
     eventDispatcherUuid: '1548943992704__DEL__126690',   // a unique id generated for eventDispatcher instance
     timeStamp: 1548943992705,                            // timestamp when sendEvent method was called
     userId: '1KL'                                        // modification we did in eventEnricher
    } 
 ]
 x
**/

eventDispatcher.sendEvent({ page: 2}); 
// This will trigger methodToPostEvents as we defined eventsToPostInSingleCall as 1 
// and this is 2nd event we are submitting

```

## Config

Any class extending `EventDispatcher` needs to call `super` in constructor with these supported config values.

```javascript
  export class EventDispatcherService extends EventDispatcher {
  constructor() {
    super({
      ...config
    });
  }
```

| Name                     | Type                  |   Description  |
| ------------------------ | --------------------- | -------- | --- |
| eventsToPostInSingleCall | `number`              | Wait for these many events before triggering `methodToPostEvents`|
    


##  Methods to be implemented

A class that extends `EventDispatcher` has to implement these methods.

| Name                     | Type                  |   Description  |
| ------------------------ | --------------------- | -------------- |
| eventEnricher            | (event: `IEvent`) => any  |  Triggered every time `sendEvent` is called, can be used to append additonal data to each event.|
| methodToPostEvents       | (data: any) =>  Promise | Triggered when after sendEvent method has been called `eventsToPostInSingleCall` times atleast.|
| getLocalStorageKeyName   | () => string  | Provide a unique string which will be used to store event in `localStorage`. Should not change on page reload. Bad example: `timeStamp`, good example: a`ppName_userId` |

## Supported methods

| Name         | arguments in order                                          | Description |
| ------------ | ----------------------------------------------------------- | ----------- |
| sendEvent    | eventToSend: IEvent; forceful = false; consoleEvent = false | `eventToSend`: event data; `forceful`: ignore the check for `eventsToPostInSingleCall` and call `methodToPostEvents` or `apiPathToPostEvents` immidiately; `consoleEvent`: console.log the event being sent to `eventToSend` method. Called after `eventEnricher` if provided |
| getEventList | no arguments                                                | Returns the events currently present with eventDispatcher instance                                                                                                                                                                                                            |
| clearEvents  | no arguments                                                | Clear the events currently present with eventDispatcher instance                                                                                                                                                                                                              |
| getUUID      | no arguments                                                | Each EventDispatcher instance gets a unique UUID, use this method to get the                                                                                                                                                                                                  |
