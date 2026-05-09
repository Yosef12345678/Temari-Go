export type BusLocationPoint = {
  id: number;
  bus_id: number;
  latitude: number;
  longitude: number;
  speed?: number | null;
  timestamp: string;
};

export type BusCurrentLocation = BusLocationPoint;
