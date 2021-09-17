import { makeInputChangeEvent } from '@objectiv/tracker-core';
import { BrowserTracker, configureTracker } from '../src/';
import makeBlurEventListener from '../src/observer/makeBlurEventListener';
import makeTrackedElement from './mocks/makeTrackedElement';

describe('makeBlurEventListener', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    configureTracker({ applicationId: 'test', endpoint: 'test' });
    expect(window.objectiv.tracker).toBeInstanceOf(BrowserTracker);
    jest.spyOn(window.objectiv.tracker, 'trackEvent');
  });

  it('should track Input Change when invoked from a valid target', () => {
    const trackedInput = makeTrackedElement('input', null, 'input');
    const blurEventListener = makeBlurEventListener(trackedInput);

    trackedInput.addEventListener('blur', blurEventListener);
    trackedInput.dispatchEvent(new FocusEvent('blur'));

    expect(window.objectiv.tracker.trackEvent).toHaveBeenCalledTimes(1);
    expect(window.objectiv.tracker.trackEvent).toHaveBeenNthCalledWith(1, makeInputChangeEvent());
  });

  it('should not track Input Change when invoked from a bubbling target', () => {
    const trackedInput = makeTrackedElement('input1', null, 'input');
    const unrelatedInput = makeTrackedElement('input2', null, 'input');
    const blurEventListener = makeBlurEventListener(trackedInput);

    trackedInput.addEventListener('blur', blurEventListener);
    unrelatedInput.dispatchEvent(new FocusEvent('blur'));

    expect(window.objectiv.tracker.trackEvent).not.toHaveBeenCalled();
  });
});