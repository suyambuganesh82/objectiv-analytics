/*
 * Copyright 2022 Objectiv B.V.
 */

import { MockConsoleImplementation, SpyTransport } from '@objectiv/testing-tools';
import { getLocationPath, TrackerConsole } from '@objectiv/tracker-core';
import { render } from '@testing-library/react-native';
import React from 'react';
import { Text } from 'react-native';
import {
  LocationTree,
  ReactNativeTracker,
  RootLocationContextWrapper,
  TrackedScrollView,
  TrackedScrollViewProps,
  TrackingContextProvider,
  useLocationStack,
} from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('TrackedScrollView', () => {
  const spyTransport = new SpyTransport();
  jest.spyOn(spyTransport, 'handle');
  const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport });
  jest.spyOn(console, 'debug').mockImplementation(jest.fn);

  const TestTrackedScrollView = (props: TrackedScrollViewProps & { testID?: string }) => (
    <TrackingContextProvider tracker={tracker}>
      <RootLocationContextWrapper id={'test'}>
        <TrackedScrollView {...props} />
      </RootLocationContextWrapper>
    </TrackingContextProvider>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  const ScrollViewChild = (props: { title: string }) => {
    const locationPath = getLocationPath(useLocationStack());

    console.debug(locationPath);

    return (
      <Text>
        {props.title}:{locationPath}
      </Text>
    );
  };

  it('should wrap ScrollView in ContentContext', () => {
    render(
      <TestTrackedScrollView id={'test-scroll-view'}>
        <ScrollViewChild title={'Child'} />
      </TestTrackedScrollView>
    );

    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenNthCalledWith(1, 'RootLocation:test / Content:test-scroll-view');
  });
});
