import { BeaconAPITransport } from '../src';
import { TrackerEvent } from '@objectiv/tracker-core';
import MockDate from 'mockdate';

const mockedMs = 1434319925275;

beforeEach(() => {
  MockDate.reset();
  MockDate.set(mockedMs);
});

afterEach(() => {
  MockDate.reset();
});

// TODO add actual Karma + Chrome tests to test the real API, instead of the mock below

// JSDOM doesn't support sendBeacon, let's just mock them
navigator.sendBeacon = jest.fn();

describe('BeaconAPITransport', () => {
  const MOCK_ENDPOINT = '/test-endpoint';

  const testEvent = new TrackerEvent({
    event: 'test-event',
  });

  it('should send using `sendBeacon` API', async () => {
    const testTransport = new BeaconAPITransport({
      endpoint: MOCK_ENDPOINT,
    });
    await testTransport.handle(testEvent);
    const { id, ...otherProps } = testEvent;
    expect(navigator.sendBeacon).toHaveBeenCalledWith(
      MOCK_ENDPOINT,
      JSON.stringify([
        {
          ...otherProps,
          transport_time: mockedMs,
          id,
        },
      ])
    );
  });

  it('should be usable only for HTTP or HTTPS endpoints', async () => {
    const testTransport1 = new BeaconAPITransport({ endpoint: `/endpoint` });
    expect(testTransport1.isUsable()).toBe(false);

    const testTransport2 = new BeaconAPITransport({ endpoint: `http://endpoint` });
    expect(testTransport2.isUsable()).toBe(true);

    const testTransport3 = new BeaconAPITransport({ endpoint: `https://endpoint` });
    expect(testTransport3.isUsable()).toBe(true);
  });
});
