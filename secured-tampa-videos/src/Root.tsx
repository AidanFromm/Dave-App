import { Composition } from "remotion";
import { PromoVideo } from "./PromoVideo";
import { ProductShowcase } from "./ProductShowcase";
import { StoreIntro } from "./StoreIntro";
import { DropAnnouncement } from "./DropAnnouncement";
import { InstagramStory } from "./InstagramStory";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* 16:9 Promo Video - Main marketing video */}
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Product Showcase - rotating product highlight */}
      <Composition
        id="ProductShowcase"
        component={ProductShowcase}
        durationInFrames={240}
        fps={30}
        width={1080}
        height={1080}
      />
      {/* Store Introduction - who we are */}
      <Composition
        id="StoreIntro"
        component={StoreIntro}
        durationInFrames={270}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Drop Announcement - new release hype */}
      <Composition
        id="DropAnnouncement"
        component={DropAnnouncement}
        durationInFrames={180}
        fps={30}
        width={1080}
        height={1920}
      />
      {/* Instagram Story - vertical format */}
      <Composition
        id="InstagramStory"
        component={InstagramStory}
        durationInFrames={210}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
