export interface IEvent {
  eventDispatcherUuid?: string;
  timeStamp?: number;
  [key: string]: any;
}

export type IEventDispatcherConfig = IEventDispatcherConfigWithApi | IEventDispatcherConfigWithMethod;

export type IMethodToPostEvents = (data: any) => Promise<any>;
export type IEventEnricher = (event: IEvent) => any;

export interface IEventDispatcherBasicConfig {
  eventsToPostInSingleCall: number | 1;
  eventEnricher?: IEventEnricher;
  apiPathToPostEvents?: string;
  methodToPostEvents?: IMethodToPostEvents;
}

export interface IEventDispatcherConfigWithApi extends IEventDispatcherBasicConfig {
  apiPathToPostEvents: string;
}

export interface IEventDispatcherConfigWithMethod extends IEventDispatcherBasicConfig {
  methodToPostEvents: IMethodToPostEvents;
}
