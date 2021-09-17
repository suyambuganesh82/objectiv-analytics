import { BrowserTracker, configureTracker } from '../src/';

describe('configureTracker', () => {
  it('should create a new Browser Tracker in window.object.tracker and start auto tracking', () => {
    configureTracker({ applicationId: 'app-id', endpoint: 'localhost' });
    expect(window.objectiv.tracker).toBeInstanceOf(BrowserTracker);
  });
});