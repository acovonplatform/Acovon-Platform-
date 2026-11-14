import { Post, Livestream } from '../types';

export const DEMO_MEDIA_VIDEOS: Array<{
  title: string;
  url: string;
  thumbnailUrl: string;
  durationSeconds: number;
  width: number;
  height: number;
  aspectRatio: string;
}> = [];

export const DEMO_POSTS: Post[] = [];

export const DEMO_LIVESTREAMS: Livestream[] = [];

export const DEMO_STATS = {
  totalCreators: 0,
  totalVideos: 0,
  totalPhotos: 0,
  totalStreams: 0
};
