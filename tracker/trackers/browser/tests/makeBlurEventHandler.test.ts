/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { matchUUID, MockConsoleImplementation } from '@objectiv/testing-tools';
import { generateUUID, LocationContextName, makeInputChangeEvent, TrackerConsole } from '@objectiv/tracker-core';
import { BrowserTracker, getTracker, getTrackerRepository, makeTracker } from '../src/';
import { makeBlurEventHandler } from '../src/mutationObserver/makeBlurEventHandler';
import { makeTaggedElement } from './mocks/makeTaggedElement';

TrackerConsole.setImplementation(MockConsoleImplementation);

describe('makeBlurEventHandler', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    makeTracker({ applicationId: generateUUID(), endpoint: 'test' });
    expect(getTracker()).toBeInstanceOf(BrowserTracker);
    jest.spyOn(getTracker(), 'trackEvent');
  });

  afterEach(() => {
    getTrackerRepository().trackersMap = new Map();
    getTrackerRepository().defaultTracker = undefined;
    jest.resetAllMocks();
  });

  it('should track Input Change when invoked from a valid target', () => {
    const trackedInput = makeTaggedElement('input', null, 'input');
    const blurEventListener = makeBlurEventHandler(trackedInput);

    trackedInput.addEventListener('blur', blurEventListener);
    trackedInput.dispatchEvent(new FocusEvent('blur'));

    expect(getTracker().trackEvent).toHaveBeenCalledTimes(1);
    expect(getTracker().trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        _type: 'InputChangeEvent',
        id: matchUUID,
        global_contexts: [],
        location_stack: [],
      })
    );
  });

  it('should not track Input Change when invoked from a bubbling target', () => {
    const trackedInput = makeTaggedElement('input1', null, 'input');
    const unrelatedInput = makeTaggedElement('input2', null, 'input');
    const blurEventListener = makeBlurEventHandler(trackedInput);

    trackedInput.addEventListener('blur', blurEventListener);
    unrelatedInput.dispatchEvent(new FocusEvent('blur'));

    expect(getTracker().trackEvent).not.toHaveBeenCalled();
  });

  it('should not track Input Change when current target is not a click-tracking tagged element', () => {
    const span = document.createElement('span');
    const trackedInput = makeTaggedElement('input', 'input', 'input', false, false);
    trackedInput.appendChild(span);
    const inputEventListener = jest.fn(makeBlurEventHandler(trackedInput, getTracker()));

    trackedInput.addEventListener('blur', inputEventListener);
    span.dispatchEvent(new MouseEvent('blur', { bubbles: true }));

    expect(inputEventListener).toHaveBeenCalled();
    expect(getTracker().trackEvent).not.toHaveBeenCalled();
  });

  it('should track Input Change when invoked from a non-tagged child', () => {
    const span = document.createElement('span');
    const trackedInput = makeTaggedElement('input', 'input', 'input', false, true);
    trackedInput.appendChild(span);
    const inputEventListener = jest.fn(makeBlurEventHandler(trackedInput, getTracker()));

    trackedInput.addEventListener('blur', inputEventListener);
    span.dispatchEvent(new MouseEvent('blur', { bubbles: true }));

    expect(inputEventListener).toHaveBeenCalled();
    expect(getTracker().trackEvent).toHaveBeenCalledTimes(1);
    expect(getTracker().trackEvent).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining(
        makeInputChangeEvent({
          location_stack: [expect.objectContaining({ _type: LocationContextName.InputContext, id: 'input' })],
        })
      )
    );
  });
});
