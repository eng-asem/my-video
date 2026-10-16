import React from "react";
import {Composition} from "remotion";
import {InsidePhone} from "./InsidePhone";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="InsidePhone"
    component={InsidePhone}
    durationInFrames={900} // 30 ثانية × 30fps
    fps={30}
    width={1920}
    height={1080}
  />
);
