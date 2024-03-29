/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import {
  LocationContextName,
  makeContentContext,
  makeHiddenEvent,
  makeVisibleEvent,
  Tracker,
} from '@objectiv/tracker-core';
import { render } from '@testing-library/react';
import React from 'react';
import { TrackingContextProvider, trackVisibility, useVisibilityTracker } from '../src';

describe('Visibility', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should track a HiddenEvent (programmatic)', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    trackVisibility({ tracker, isVisible: false });

    expect(tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(tracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeHiddenEvent()), undefined);
  });

  it('should track a HiddenEvent (hook relying on TrackingContextProvider)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });

    const Component = () => {
      const trackVisibility = useVisibilityTracker({ isVisible: false });
      trackVisibility();

      return <>Component triggering HiddenEvent via Visibility Event Tracker</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'HiddenEvent' }));
  });

  it('should track a HiddenEvent (hook with custom tracker and location)', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    const customTracker = new Tracker({ applicationId: 'app-id-2' });
    jest.spyOn(customTracker, 'trackEvent');

    const Component = () => {
      const trackVisibility = useVisibilityTracker({
        isVisible: false,
        tracker: customTracker,
        locationStack: [makeContentContext({ id: 'override' })],
      });
      trackVisibility();

      return <>Component triggering HiddenEvent</>;
    };

    const location1 = makeContentContext({ id: 'root' });
    const location2 = makeContentContext({ id: 'child' });

    render(
      <TrackingContextProvider tracker={tracker} locationStack={[location1, location2]}>
        <Component />
      </TrackingContextProvider>
    );

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(customTracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(customTracker.trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining(
        makeHiddenEvent({
          location_stack: [expect.objectContaining({ _type: LocationContextName.ContentContext, id: 'override' })],
        })
      ),
      undefined
    );
  });

  it('should track a VisibleEvent (programmatic)', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    trackVisibility({ tracker, isVisible: true });

    expect(tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(tracker.trackEvent).toHaveBeenNthCalledWith(1, expect.objectContaining(makeVisibleEvent()), undefined);
  });

  it('should track a VisibleEvent (hook relying on TrackingContextProvider)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });

    const Component = () => {
      const trackVisibility = useVisibilityTracker({ isVisible: true });
      trackVisibility();

      return <>Component triggering VisibleEvent via Visibility Event Tracker</>;
    };

    render(
      <TrackingContextProvider tracker={tracker}>
        <Component />
      </TrackingContextProvider>
    );

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(1, expect.objectContaining({ _type: 'VisibleEvent' }));
  });

  it('should track a VisibleEvent (hook with custom tracker and location)', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    const customTracker = new Tracker({ applicationId: 'app-id-2' });
    jest.spyOn(customTracker, 'trackEvent');

    const Component = () => {
      const trackVisibility = useVisibilityTracker({
        isVisible: true,
        tracker: customTracker,
        locationStack: [makeContentContext({ id: 'override' })],
      });
      trackVisibility();

      return <>Component triggering VisibleEvent via Visibility Event Tracker</>;
    };

    const location1 = makeContentContext({ id: 'root' });
    const location2 = makeContentContext({ id: 'child' });

    render(
      <TrackingContextProvider tracker={tracker} locationStack={[location1, location2]}>
        <Component />
      </TrackingContextProvider>
    );

    expect(tracker.trackEvent).not.toHaveBeenCalled();
    expect(customTracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(customTracker.trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining(
        makeVisibleEvent({
          location_stack: [expect.objectContaining({ _type: LocationContextName.ContentContext, id: 'override' })],
        })
      ),
      undefined
    );
  });
});
