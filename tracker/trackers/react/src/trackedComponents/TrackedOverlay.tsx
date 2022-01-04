/*
 * Copyright 2021-2022 Objectiv B.V.
 */

import { OverlayContextWrapper } from "@objectiv/tracker-core-react/src/locationWrappers/OverlayContextWrapper";
import { trackVisibility } from "@objectiv/tracker-core-react/src/eventTrackers/trackVisibility";
import React from 'react';
import { TrackedComponent } from "./trackedTypes";

export type TrackedOverlayProps = TrackedComponent<React.HTMLAttributes<HTMLDivElement>> & {
  id: string,
  forwardId?: boolean,
  isVisible: boolean
};

// TODO support forward ref, we need a generic type since Component can be any HTML element or React Component
export const TrackedOverlay = (props: TrackedOverlayProps) => {
  const { Component, id, forwardId, isVisible, ...otherProps } = props;

  return (
    <OverlayContextWrapper id={id}>
      {trackingContext => {
        trackVisibility({ isVisible, ...trackingContext });
        return Component ?
          <Component {...otherProps} id={forwardId ? id: undefined} /> :
          <div id={forwardId ? id: undefined} {...otherProps} />;
      }}

    </OverlayContextWrapper>
  );
};
