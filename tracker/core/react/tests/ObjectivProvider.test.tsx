/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { matchUUID, MockConsoleImplementation } from '@objectiv/testing-tools';
import {
  GlobalContextName,
  GlobalContextValidationRule,
  LocationContextName,
  LocationContextValidationRule,
  makeApplicationLoadedEvent,
  Tracker,
  TrackerConsole,
  TrackerPlatform,
} from '@objectiv/tracker-core';
import { render } from '@testing-library/react';
import React from 'react';
import { ObjectivProvider, useTrackingContext } from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('ObjectivProvider', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const tracker = new Tracker({ applicationId: 'app-id' });

  const expectedState = {
    locationStack: [],
    tracker: {
      platform: TrackerPlatform.CORE,
      active: true,
      applicationId: 'app-id',
      global_contexts: [],
      location_stack: [],
      plugins: expect.objectContaining({
        plugins: [
          {
            pluginName: 'OpenTaxonomyValidationPlugin',
            validationRules: [
              new GlobalContextValidationRule({
                logPrefix: 'OpenTaxonomyValidationPlugin',
                contextName: GlobalContextName.ApplicationContext,
                once: true,
              }),
              new LocationContextValidationRule({
                logPrefix: 'OpenTaxonomyValidationPlugin',
                contextName: LocationContextName.RootLocationContext,
                once: true,
                position: 0,
              }),
            ],
          },
          {
            applicationContext: {
              __instance_id: matchUUID,
              __global_context: true,
              _type: GlobalContextName.ApplicationContext,
              id: 'app-id',
            },
            pluginName: 'ApplicationContextPlugin',
          },
        ],
      }),
      queue: undefined,
      trackerId: 'app-id',
      transport: undefined,
    },
  };

  it('should support children components', () => {
    const Component = () => {
      const trackingContext = useTrackingContext();

      console.log(trackingContext);

      return null;
    };

    render(
      <ObjectivProvider tracker={tracker}>
        <Component />
      </ObjectivProvider>
    );

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenNthCalledWith(1, expectedState);
  });

  it('should console.error if nested', () => {
    render(
      <ObjectivProvider tracker={tracker}>
        <ObjectivProvider tracker={tracker}>test</ObjectivProvider>
      </ObjectivProvider>
    );

    expect(console.error).toHaveBeenCalledTimes(1);
    expect(console.error).toHaveBeenNthCalledWith(
      1,
      `
      ｢objectiv｣ ObjectivProvider should not be nested and should be placed as high as possible in the Application. 
      To override Tracker and/or LocationStack, use TrackingContextProvider instead.
    `
    );
  });

  it('should support render-props', () => {
    render(<ObjectivProvider tracker={tracker}>{(trackingContext) => console.log(trackingContext)}</ObjectivProvider>);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenNthCalledWith(1, expectedState);
  });

  it('should not track ApplicationLoaded', () => {
    render(<ObjectivProvider tracker={tracker}>{(trackingContext) => console.log(trackingContext)}</ObjectivProvider>);

    expect(console.log).toHaveBeenCalledTimes(1);
    expect(console.log).toHaveBeenNthCalledWith(1, expectedState);
  });

  it('should track an ApplicationLoadedEvent', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    render(<ObjectivProvider tracker={tracker}>app</ObjectivProvider>);

    expect(tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(tracker.trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining(makeApplicationLoadedEvent()),
      undefined
    );
  });

  it('should not track ApplicationLoadedEvent', () => {
    const tracker = new Tracker({ applicationId: 'app-id' });
    jest.spyOn(tracker, 'trackEvent');

    render(
      <ObjectivProvider tracker={tracker} options={{ trackApplicationLoaded: false }}>
        app
      </ObjectivProvider>
    );

    expect(tracker.trackEvent).not.toHaveBeenCalled();
  });
});
