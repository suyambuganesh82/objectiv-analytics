/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { AbstractLocationContext } from '@objectiv/schema';
import { AnyLocationContext } from '../../definitions/LocationContext';

/**
 * A type guard to determine if the given object is a LocationContext.
 */
export const isLocationContext = (locationContext: AbstractLocationContext): locationContext is AnyLocationContext => {
  if (typeof locationContext !== 'object' || locationContext === null) {
    return false;
  }

  if (!locationContext._type) {
    return false;
  }

  if (!locationContext.id) {
    return false;
  }

  return [
    'ContentContext',
    'ExpandableContext',
    'InputContext',
    'LinkContext',
    'MediaPlayerContext',
    'NavigationContext',
    'OverlayContext',
    'PressableContext',
    'RootLocationContext',
  ].includes(locationContext._type);
};
