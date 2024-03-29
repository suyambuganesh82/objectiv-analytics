/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { LocationContextName, Tracker } from '@objectiv/tracker-core';
import { fireEvent, getByText, render } from '@testing-library/react';
import React from 'react';
import {
  RootLocationContextWrapper,
  ObjectivProvider,
  trackPressEvent,
  usePressEventTracker,
  LocationTree,
} from '../src';

describe('RootLocationContextWrapper', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should wrap the given children in a RootLocationContext (trigger via Component)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });
    jest.spyOn(spyTransport, 'handle');

    const rootLocationContextProps = { id: 'test-root' };
    const TrackedButton = () => {
      const trackPressEvent = usePressEventTracker();
      return <div onClick={trackPressEvent}>Trigger Event</div>;
    };
    const { container } = render(
      <ObjectivProvider tracker={tracker}>
        <RootLocationContextWrapper {...rootLocationContextProps}>
          <TrackedButton />
        </RootLocationContextWrapper>
      </ObjectivProvider>
    );

    jest.resetAllMocks();

    fireEvent.click(getByText(container, /trigger event/i));

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'PressEvent',
        location_stack: [
          expect.objectContaining({
            _type: LocationContextName.RootLocationContext,
            ...rootLocationContextProps,
          }),
        ],
      })
    );
  });

  it('should wrap the given children in a RootLocationContext (trigger via render-props)', () => {
    const spyTransport = { transportName: 'SpyTransport', handle: jest.fn(), isUsable: () => true };
    const tracker = new Tracker({ applicationId: 'app-id', transport: spyTransport });
    jest.spyOn(spyTransport, 'handle');

    const rootLocationContextProps = { id: 'test-root' };
    const { container } = render(
      <ObjectivProvider tracker={tracker}>
        <RootLocationContextWrapper {...rootLocationContextProps}>
          {(trackingContext) => <div onClick={() => trackPressEvent(trackingContext)}>Trigger Event</div>}
        </RootLocationContextWrapper>
      </ObjectivProvider>
    );

    jest.resetAllMocks();

    fireEvent.click(getByText(container, /trigger event/i));

    expect(spyTransport.handle).toHaveBeenCalledTimes(1);
    expect(spyTransport.handle).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'PressEvent',
        location_stack: [
          expect.objectContaining({
            _type: LocationContextName.RootLocationContext,
            ...rootLocationContextProps,
          }),
        ],
      })
    );
  });
});
