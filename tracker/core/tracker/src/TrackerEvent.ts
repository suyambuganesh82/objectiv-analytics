import {
  AbstractEvent,
  AbstractGlobalContext,
  AbstractLocationContext,
  Contexts,
  DiscriminatingPropertyPrefix,
} from '@objectiv/schema';
import { ContextsConfig } from './Context';
import { generateUUID, getObjectKeys } from './helpers';

/**
 * TrackerEvents are simply a combination of an `event` name and their Contexts.
 * Contexts are entirely optional, although Collectors will mostly likely enforce minimal requirements around them.
 * Eg. An interactive TrackerEvent without a Location Stack is probably not descriptive enough to be acceptable.
 */
export type TrackerEventConfig = Pick<AbstractEvent, 'event'> & ContextsConfig;

/**
 * An Event before it has been handed over to the Tracker.
 * Properties that will be set by the Tracker or Transport are omitted: `id`, `tracking_time`, `transport_time`
 */
export type UntrackedEvent = Omit<AbstractEvent, 'id' | 'tracking_time' | 'transport_time'>;

/**
 * An Event right after the Tracker started handling it. Before enrichment by Plugins and Transport.
 * The Event will have an unique `id` and a `tracking_time` assigned by the Tracker.
 * Properties that will be set by the Transport are omitted: `transport_time`
 */
export type TrackedEvent = Omit<AbstractEvent, 'transport_time'>;

/**
 * Our main TrackerEvent interface and basic implementation
 */
export class TrackerEvent implements UntrackedEvent, Contexts {
  // Event interface
  readonly event: string;

  // Contexts interface
  readonly location_stack: AbstractLocationContext[];
  readonly global_contexts: AbstractGlobalContext[];

  /**
   * Configures the TrackerEvent instance via a TrackerEventConfig and optionally one or more ContextConfig.
   *
   * TrackerEventConfig is used mainly to configure the `event` property, although it can also carry Contexts.
   *
   * ContextConfigs are used to configure location_stack and global_contexts. If multiple configurations have been
   * provided they will be merged onto each other to produce a single location_stack and global_contexts.
   */
  constructor({ event, ...otherEventProps }: TrackerEventConfig, ...contextConfigs: ContextsConfig[]) {
    // Let's copy the entire eventConfiguration in state
    this.event = event;
    Object.assign(this, otherEventProps);

    // Start with empty context lists
    let new_location_stack: AbstractLocationContext[] = [];
    let new_global_contexts: AbstractGlobalContext[] = [];

    // Process ContextConfigs first. Same order as they have been passed
    contextConfigs.forEach(({ location_stack, global_contexts }) => {
      new_location_stack = [...new_location_stack, ...(location_stack ?? [])];
      new_global_contexts = [...new_global_contexts, ...(global_contexts ?? [])];
    });

    // And finally add the TrackerEvent Contexts on top. For Global Contexts instead we do the opposite.
    this.location_stack = [...new_location_stack, ...(otherEventProps.location_stack ?? [])];
    this.global_contexts = [...(otherEventProps.global_contexts ?? []), ...new_global_contexts];
  }

  /**
   * Custom JSON serializer that cleans up the discriminatory properties we use internally to differentiate
   * between Contexts and Event types. This ensures the Event we send to Collectors has only OSF properties.
   */
  toJSON() {
    // All discriminating properties start with this prefix
    const DISCRIMINATING_PROPERTY_PREFIX: DiscriminatingPropertyPrefix = '__';

    // Clone the TrackerEvent to avoid mutating the original
    const cleanedTrackerEvent: TrackerEvent = new TrackerEvent(this);

    // Our cleaning function
    const cleanObjectFromDiscriminatingProperties = <T extends object>(obj: T) => {
      getObjectKeys(obj).forEach((propertyName) => {
        if (propertyName.toString().startsWith(DISCRIMINATING_PROPERTY_PREFIX)) {
          delete obj[propertyName];
        }
      });
    };

    // Remove all discriminating properties from the TrackerEvent itself, its location_stack and its global_contexts
    cleanObjectFromDiscriminatingProperties(cleanedTrackerEvent);
    cleanedTrackerEvent.location_stack.map(cleanObjectFromDiscriminatingProperties);
    cleanedTrackerEvent.global_contexts.map(cleanObjectFromDiscriminatingProperties);

    return cleanedTrackerEvent;
  }
}

/**
 * A TrackerEvent that's been handed over to a Tracker.
 * At construction it decorates itself with `id` and `tracking_time`.
 * This event is factored by the Tracker immediately after receiving a TrackerEvent via the trackEvent method.
 */
export class TrackerTrackedEvent extends TrackerEvent implements TrackedEvent {
  id: string;
  tracking_time: number;

  /**
   * Extends the regular TrackerEvent by automatically setting `id` and `tracking_time` properties.
   */
  constructor(config: TrackerEventConfig, ...contextConfigs: ContextsConfig[]) {
    super(config, ...contextConfigs);

    // Generate a unique UUID v4 for this event
    this.id = generateUUID();

    // Set tracking_time
    this.tracking_time = Date.now();
  }
}
