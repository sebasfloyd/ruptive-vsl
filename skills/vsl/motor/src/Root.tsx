import React from "react";
import { Composition } from "remotion";
import { Vsl, totalFrames } from "./Vsl";

export const RemotionRoot: React.FC = () => (
  <Composition id="vsl" component={Vsl} fps={30} width={1920} height={1080} durationInFrames={totalFrames()} />
);
