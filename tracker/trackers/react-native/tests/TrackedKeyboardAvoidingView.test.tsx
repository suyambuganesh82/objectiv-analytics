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
  TrackedKeyboardAvoidingView,
  TrackedKeyboardAvoidingViewProps,
  TrackingContextProvider,
  useLocationStack,
} from '../src';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('TrackedKeyboardAvoidingView', () => {
  const spyTransport = new SpyTransport();
  jest.spyOn(spyTransport, 'handle');
  const tracker = new ReactNativeTracker({ applicationId: 'app-id', transport: spyTransport });
  jest.spyOn(console, 'debug').mockImplementation(jest.fn);

  const TestTrackedKeyboardAvoidingView = (props: TrackedKeyboardAvoidingViewProps & { testID?: string }) => (
    <TrackingContextProvider tracker={tracker}>
      <RootLocationContextWrapper id={'test'}>
        <TrackedKeyboardAvoidingView {...props} />
      </RootLocationContextWrapper>
    </TrackingContextProvider>
  );

  beforeEach(() => {
    jest.resetAllMocks();
    LocationTree.clear();
  });

  const KeyboardAvoidingViewChild = (props: { title: string }) => {
    const locationPath = getLocationPath(useLocationStack());

    console.debug(locationPath);

    return (
      <Text>
        {props.title}:{locationPath}
      </Text>
    );
  };

  it('should wrap KeyboardAvoidingView in ContentContext', () => {
    render(
      <TestTrackedKeyboardAvoidingView id={'test-keyboard-avoiding-view'}>
        <KeyboardAvoidingViewChild title={'Child'} />
      </TestTrackedKeyboardAvoidingView>
    );

    expect(console.debug).toHaveBeenCalledTimes(1);
    expect(console.debug).toHaveBeenNthCalledWith(1, 'RootLocation:test / Content:test-keyboard-avoiding-view');
  });
});
