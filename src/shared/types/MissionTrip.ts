export interface MissionTrip {
  id: string;
  location: string;
  country: string;
  coordinates: {
    lng: number;
    lat: number;
  };
  date: string;
  duration: string;
  title: string;
  description: string;
  story: string;
  images: string[];
  highlights: string[];
  peopleReached?: number;
  ministryType: string[];
  status?: 'completed' | 'upcoming';
}
