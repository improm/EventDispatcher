/**
 *  Created by: Promil Bhardwaj
 */

import { IEvent, IEventDispatcherConfig } from './EventDispatcher';

export default class EventDispatcher {
  private EVENT_QUEUE: IEvent[] = [];

  private config: IEventDispatcherConfig;
  private UUID: string = '';
  private storageKeyName: string = '';

  constructor(config: IEventDispatcherConfig) {
    this.config = config;
    this.init();
  }

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
    if (this.config.eventEnricher) {
      modifiedEventToSend = this.config.eventEnricher(modifiedEventToSend);
    }

    /**
     * Set this to true in dev environments
     * Might help in debuggind and verifying data
     */
    if (consoleEvent === true) {
      console.log(modifiedEventToSend);
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

  /**
   * returns uuid of this instance
   * @returns string
   */
  public getUUID(): string {
    return this.UUID;
  }

  /**
   * Initialize a EventDispatcher instance
   * Each instance gets a unqiue UUID
   * Global Event listener for window close event is added
   */
  private init(): void {
    // Generate a uuid
    this.UUID = this.getSessionUUID();

    // Check if already some events are dumped in localstorage
    const eventQueue = this.getEventsFromStorage();
    if (eventQueue && eventQueue.length) {
      this.EVENT_QUEUE = this.EVENT_QUEUE.concat(eventQueue);
      this.emptyLocalStorage();
    }

    // attach listener to tab close event
    this.attachWindowCloseEvent();

    this.storageKeyName = this.generateKeyNameForStorage();
  }

  /**
   * Generate a keyname for saving events to local storage
   * @returns string
   */
  private generateKeyNameForStorage(): string {
    if (this.config.storageKeyPrefix) {
      return this.config.storageKeyPrefix + '_dispatcher_';
    } else {
      return 'dispatcher_';
    }
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
      const eventDispatcher = localStorage.getItem(this.storageKeyName);
      return eventDispatcher ? JSON.parse(eventDispatcher) : [];
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
   * Generates a unique UUID every time it is called
   * A combination of timestamp ,seperator and a random number
   * @returns string
   */
  private getSessionUUID(): string {
    return new Date().getTime() + '__DEL__' + Math.floor(Math.random() * 1000000);
  }

  /**
   * Checks the event queue length, processes them if full and then adds a new event to queue
   */
  private addAndProcessEvent(event: IEvent): void {
    if (this.EVENT_QUEUE.length >= this.config.eventsToPostInSingleCall) {
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
   * method to handle submission of event
   * Based on the configuration with which the Object of the class was created
   * Either post data to server itself using url provided in config
   *  or trigger the callback method provided in config
   * @param data
   */
  private handleEventSubmission(data: any): void {
    if (this.config.apiPathToPostEvents) {
      this.postDataToServer(data);
    } else if (typeof this.config.methodToPostEvents === 'function') {
      this.config.methodToPostEvents(data);
    }
  }

  /**
   * Using native fetch api, post the data to the path provided in the config
   * @param data
   */
  private postDataToServer(data: any): void {
    if (this.config.apiPathToPostEvents) {
      fetch(this.config.apiPathToPostEvents, {
        body: JSON.stringify(data),
        headers: {
          Accep: 'application/json',
          'Content-Type': 'application/json'
        },
        method: 'POST'
      });
    }
  }
}