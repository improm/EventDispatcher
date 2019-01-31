/**
 *  Created by: Promil Bhardwaj
 */

export interface IEvent {
  eventDispatcherUuid?: string;
  timeStamp?: number;
  [key: string]: any;
}

export interface IConfig {
  eventsToPostInSingleCall: number;
}

export default abstract class EventDispatcher {
  /**
   * club these many events before processing them
   */
  private eventsToPostInSingleCall: number = 1;
  /**
   * stores the events pushed to EventDispatcher isntance
   * Always in sync with values stored in local storage
   */
  private EVENT_QUEUE: IEvent[] = [];

  /**
   * A unique UUID is appended to each instance of EventDispatcher instance
   */
  private UUID: string = '';

  /**
   * EventDispatcher instance uses localStorage to persist events across browser close and reload events
   * A unqiue key of the sort userId_analyticEvents to prevent overiding of events for multiple users
   * logging in to the same broswer.
   */
  private storageKeyName: string = '';

  constructor(config: IConfig) {
    this.eventsToPostInSingleCall = config.eventsToPostInSingleCall;
    this.init();
  }

  /**
   * Called every time sendEvent method called.
   */
  public abstract eventEnricher(event: IEvent): any;

  /**
   * Triggered after sendEvent method has been called
   * more then eventsToPostInSingleCall times.
   */
  public abstract methodToPostEvents(data: any): Promise<any>;

  /**
   * A unique string to be used as a key to save items to localStorage.
   * Don't use timestamp. Use something unique for a user. eg. appName_userId
   */
  public abstract getLocalStorageKeyName(): string;

  /**
   * Method to accept new events from user
   * either adds the event to the queue and processes it when queue is full
   * or use the forceful flag to immidiately sent the event to server
   * @param eventToSend
   * @param forceful
   * @param boolean
   */
  public sendEvent(eventToSend: IEvent, forceful = false, consoleEvent = false): void {
    /**
     * this data will be appended to all events
     */
    let modifiedEventToSend: IEvent = {
      ...eventToSend,
      eventDispatcherUuid: this.UUID,
      timeStamp: new Date().getTime()
    };
    /**
     * Append some extra data to each event, like user id, page name etc
     */
    modifiedEventToSend = this.eventEnricher(modifiedEventToSend);

    /**
     * Set this to true in dev environments
     * Might help in debuggind and verifying data
     */
    if (consoleEvent === true) {
      console.log('console.log test', modifiedEventToSend);
    }
    this.addAndProcessEvent(modifiedEventToSend);

    if (forceful) {
      this.handleEventSubmission(this.EVENT_QUEUE.slice(0));
    }
  }

  /**
   * Returns list of events currently with this eventDispatcher instance
   * @returns Event[]
   */
  public getEventList(): IEvent[] {
    if (this.isLocalStorageAvailable()) {
      return this.getEventsFromStorage();
    } else {
      return this.EVENT_QUEUE;
    }
  }

  /**
   * Clears up all events from runtime memory as well as local storage
   */
  public clearEvents() {
    this.emptyLocalStorage();
    this.EVENT_QUEUE = [];
  }

  /*
   * Generates a unique UUID every time it is called
   * A combination of timestamp ,seperator and a random number
   * @returns string
   */
  public getUUID(): string {
    if (this.UUID) {
      return this.UUID;
    } else {
      this.UUID = new Date().getTime() + '__DEL__' + Math.floor(Math.random() * 1000000);
      return this.UUID;
    }
  }

  /**
   * Initialize a EventDispatcher instance
   * Each instance gets a unqiue UUID
   * Global Event listener for window close event is added
   */
  private init(): void {
    // Generate a uuid
    this.UUID = this.getUUID();

    // Check if already some events are dumped in localstorage
    const eventQueue = this.getEventsFromStorage();
    if (eventQueue && eventQueue.length) {
      this.EVENT_QUEUE = this.EVENT_QUEUE.concat(eventQueue);
      this.emptyLocalStorage();
    }

    // attach listener to tab close event
    this.attachWindowCloseEvent();

    this.storageKeyName = this.getLocalStorageKeyName();
  }

  /**
   * Listen to tab close event and publish an event for the same
   */
  private attachWindowCloseEvent(): void {
    if (typeof window === 'object') {
      window.addEventListener('beforeunload', () => {
        const event: IEvent = { eventName: 'WINDOW_CLOSED' };
        this.sendEvent(event, false);
      });
    }
  }

  /**
   * Returns list of events already existing in localstorage
   * @returns Event[]
   */
  private getEventsFromStorage(): IEvent[] {
    if (this.isLocalStorageAvailable()) {
      const keyName = this.getLocalStorageKeyName();
      const value = localStorage.getItem(keyName);
      if (value) {
        return JSON.parse(value) || [];
      } else {
        return [];
      }
    } else {
      return [];
    }
  }

  /**
   * Saves a list of events to localstorage
   * @param events
   */
  private saveEventsToStorage(events: IEvent[]): void {
    if (this.isLocalStorageAvailable() && Array.isArray(events)) {
      localStorage.setItem(this.storageKeyName, JSON.stringify(events));
    }
  }

  /**
   * Empty the local storage
   */
  private emptyLocalStorage() {
    if (this.isLocalStorageAvailable()) {
      localStorage.removeItem(this.storageKeyName);
    }
  }

  /**
   * Whether local storage is available or not
   * @returns boolean
   */
  private isLocalStorageAvailable(): boolean {
    return !!(typeof window === 'object' && typeof window.localStorage === 'object');
  }

  /**
   * Checks the event queue length, processes them if full and then adds a new event to queue
   */
  private addAndProcessEvent(event: IEvent): void {
    if (this.EVENT_QUEUE.length >= this.eventsToPostInSingleCall) {
      this.handleEventSubmission(this.EVENT_QUEUE.slice(0));
      this.emptyQueue();
    }
    this.addToQueue(event);
  }

  /**
   * Clean up the event queue from memory as well as localstorage
   */
  private emptyQueue(): void {
    this.EVENT_QUEUE = [];
    this.emptyLocalStorage();
  }

  /**
   * Adds the event to the queue , updates the queue in localstorage
   * @param event
   */
  private addToQueue(event: IEvent): void {
    this.EVENT_QUEUE.push(event);
    this.saveEventsToStorage(this.EVENT_QUEUE);
  }

  /**
   * method to handle submission of events.
   * @param data
   */
  private handleEventSubmission(data: any): void {
    this.methodToPostEvents(data);
  }
}
