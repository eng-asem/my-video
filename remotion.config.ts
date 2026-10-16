import {Config} from "@remotion/cli/config";

// جودة عالية للخطوط الرفيعة: إطارات PNG وضغط H.264 منخفض الفقد
Config.setVideoImageFormat("png");
Config.setCrf(16);
Config.setOverwriteOutput(true);
