import { ContextsConfig, Tracker, TrackerEvent, TrackerPlugin, TrackerPlugins } from '../src';
import { LogTransport, noop, UnusableTransport } from './mocks';

describe('Tracker', () => {
  it('should instantiate without any config', () => {
    const testTracker = new Tracker();
    expect(testTracker).toBeInstanceOf(Tracker);
    expect(testTracker.transport).toBe(undefined);
    expect(testTracker.plugins).toBe(undefined);
    expect(testTracker.location_stack).toStrictEqual([]);
    expect(testTracker.global_contexts).toStrictEqual([]);
  });

  it('should instantiate with tracker config', () => {
    const testTransport = new LogTransport();
    const testTracker = new Tracker({ transport: testTransport });
    expect(testTracker).toBeInstanceOf(Tracker);
    expect(testTracker.transport).toStrictEqual(testTransport);
    expect(testTracker.plugins).toBe(undefined);
    expect(testTracker.location_stack).toStrictEqual([]);
    expect(testTracker.global_contexts).toStrictEqual([]);
  });

  it('should instantiate with another Tracker, inheriting its state, yet being independent instances', () => {
    const initialContextsState: ContextsConfig = {
      location_stack: [
        { __location_context: true, _context_type: 'section', id: 'root' },
        { __location_context: true, _context_type: 'section', id: 'A' },
      ],
      global_contexts: [
        { __global_context: true, _context_type: 'global', id: 'A' },
        { __global_context: true, _context_type: 'global', id: 'B' },
      ],
    };

    const testTracker = new Tracker(initialContextsState);
    expect(testTracker.location_stack).toEqual(initialContextsState.location_stack);
    expect(testTracker.global_contexts).toEqual(initialContextsState.global_contexts);

    // Create a clone of the existing tracker
    const newTestTracker = new Tracker(testTracker);
    expect(newTestTracker).toBeInstanceOf(Tracker);
    // They should be identical (yet separate instances)
    expect(newTestTracker).toEqual(testTracker);

    // Refine Location Stack of the new Tracker with an extra Section
    newTestTracker.location_stack.push({ __location_context: true, _context_type: 'section', id: 'X' });

    // The old tracker should be unaffected
    expect(testTracker.location_stack).toEqual(initialContextsState.location_stack);
    expect(testTracker.global_contexts).toEqual(initialContextsState.global_contexts);

    // While the new Tracker should now have a deeper Location Stack
    expect(newTestTracker.location_stack).toEqual([
      { __location_context: true, _context_type: 'section', id: 'root' },
      { __location_context: true, _context_type: 'section', id: 'A' },
      { __location_context: true, _context_type: 'section', id: 'X' },
    ]);
    expect(newTestTracker.global_contexts).toEqual([
      { __global_context: true, _context_type: 'global', id: 'A' },
      { __global_context: true, _context_type: 'global', id: 'B' },
    ]);
  });

  it('should allow complex compositions of multiple Tracker instances and Configs', () => {
    const mainTrackerContexts: ContextsConfig = {
      location_stack: [
        { __location_context: true, _context_type: 'section', id: 'root' },
        { __location_context: true, _context_type: 'section', id: 'A' },
      ],
      global_contexts: [
        { __global_context: true, _context_type: 'global', id: 'X' },
        { __global_context: true, _context_type: 'global', id: 'Y' },
      ],
    };
    const mainTracker = new Tracker(mainTrackerContexts);

    // This new tracker is a clone of the mainTracker and extends it with two custom Contexts configuration
    const sectionTracker = new Tracker(
      mainTracker,
      {
        location_stack: [{ __location_context: true, _context_type: 'section', id: 'B' }],
        global_contexts: [{ __global_context: true, _context_type: 'global', id: 'Z' }],
      },
      {
        location_stack: [{ __location_context: true, _context_type: 'section', id: 'C' }],
      },
      // These last two configurations are useless, but we want to make sure nothing breaks with them
      {
        global_contexts: [],
      },
      {}
    );

    // The old tracker should be unaffected
    expect(mainTracker.location_stack).toEqual(mainTrackerContexts.location_stack);
    expect(mainTracker.global_contexts).toEqual(mainTrackerContexts.global_contexts);

    // The new Tracker, instead, should have all of the Contexts of the mainTracker + the extra Config provided
    expect(sectionTracker.location_stack).toEqual([
      { __location_context: true, _context_type: 'section', id: 'root' },
      { __location_context: true, _context_type: 'section', id: 'A' },
      { __location_context: true, _context_type: 'section', id: 'B' },
      { __location_context: true, _context_type: 'section', id: 'C' },
    ]);
    expect(sectionTracker.global_contexts).toEqual([
      { __global_context: true, _context_type: 'global', id: 'X' },
      { __global_context: true, _context_type: 'global', id: 'Y' },
      { __global_context: true, _context_type: 'global', id: 'Z' },
    ]);
  });

  describe('trackEvent', () => {
    const eventContexts: ContextsConfig = {
      location_stack: [
        { __location_context: true, _context_type: 'section', id: 'B' },
        { __location_context: true, _context_type: 'item', id: 'C' },
      ],
      global_contexts: [
        { __global_context: true, _context_type: 'global', id: 'W' },
        { __global_context: true, _context_type: 'global', id: 'X' },
      ],
    };
    const testEvent = new TrackerEvent(
      {
        event: 'test-event',
      },
      eventContexts
    );

    it('should merge Tracker Location Stack and Global Contexts with the Event ones', () => {
      const trackerContexts: ContextsConfig = {
        location_stack: [
          { __location_context: true, _context_type: 'section', id: 'root' },
          { __location_context: true, _context_type: 'section', id: 'A' },
        ],
        global_contexts: [
          { __global_context: true, _context_type: 'global', id: 'Y' },
          { __global_context: true, _context_type: 'global', id: 'Z' },
        ],
      };
      const testTracker = new Tracker(trackerContexts);
      expect(testEvent.location_stack).toStrictEqual(eventContexts.location_stack);
      expect(testEvent.global_contexts).toStrictEqual(eventContexts.global_contexts);
      const trackedEvent = testTracker.trackEvent(testEvent);
      expect(testEvent.location_stack).toStrictEqual(eventContexts.location_stack);
      expect(testEvent.global_contexts).toStrictEqual(eventContexts.global_contexts);
      expect(testTracker.location_stack).toStrictEqual(trackerContexts.location_stack);
      expect(testTracker.global_contexts).toStrictEqual(trackerContexts.global_contexts);
      expect(trackedEvent.location_stack).toStrictEqual([
        { __location_context: true, _context_type: 'section', id: 'root' },
        { __location_context: true, _context_type: 'section', id: 'A' },
        { __location_context: true, _context_type: 'section', id: 'B' },
        { __location_context: true, _context_type: 'item', id: 'C' },
      ]);
      expect(trackedEvent.global_contexts).toStrictEqual([
        { __global_context: true, _context_type: 'global', id: 'W' },
        { __global_context: true, _context_type: 'global', id: 'X' },
        { __global_context: true, _context_type: 'global', id: 'Y' },
        { __global_context: true, _context_type: 'global', id: 'Z' },
      ]);
    });

    it('should execute all plugins implementing the initialize callback', () => {
      const pluginC: TrackerPlugin = { pluginName: 'pluginC', initialize: jest.fn(noop) };
      const pluginD: TrackerPlugin = { pluginName: 'pluginD', initialize: jest.fn(noop) };
      const testTracker = new Tracker({ plugins: new TrackerPlugins([pluginC, pluginD]) });
      expect(pluginC.initialize).toHaveBeenCalledWith(testTracker);
      expect(pluginD.initialize).toHaveBeenCalledWith(testTracker);
    });

    it('should execute all plugins implementing the beforeTransport callback', () => {
      const pluginE: TrackerPlugin = { pluginName: 'pluginE', beforeTransport: jest.fn(noop) };
      const pluginF: TrackerPlugin = { pluginName: 'pluginF', beforeTransport: jest.fn(noop) };
      const testTracker = new Tracker({ plugins: new TrackerPlugins([pluginE, pluginF]) });
      testTracker.trackEvent(testEvent);
      expect(pluginE.beforeTransport).toHaveBeenCalledWith(testEvent);
      expect(pluginF.beforeTransport).toHaveBeenCalledWith(testEvent);
    });

    it('should send the Event via the given TrackerTransport', () => {
      const testTransport = new LogTransport();
      jest.spyOn(testTransport, 'handle');
      const testTracker = new Tracker({ transport: testTransport });
      testTracker.trackEvent(testEvent);
      expect(testTransport.handle).toHaveBeenCalledWith(testEvent);
    });

    it("should not send the Event via the given TrackerTransport if it's not usable", () => {
      const unusableTransport = new UnusableTransport();
      expect(unusableTransport.isUsable()).toEqual(false);
      jest.spyOn(unusableTransport, 'handle');
      const testTracker = new Tracker({ transport: unusableTransport });
      testTracker.trackEvent(testEvent);
      expect(unusableTransport.handle).not.toHaveBeenCalled();
    });
  });
});