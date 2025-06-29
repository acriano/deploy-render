export interface CollectionPoint {
  id: number;
  name: string;
  shortName?: string;
  address: string;
  latitude: number;
  longitude: number;
  schedule?: string;
  phone?: string;
  website?: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt?: string;
  createdBy?: number;
}

export interface AcceptedMaterial {
  id: number;
  collectionPointId: number;
  materialType: string;
  description?: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface RecycleMaterialFromDB {
  id: string | number;
  name: string;
  description: string;
  color?: string;
  youtube_url?: string;
  recyclable_items: string; // JSON string
  non_recyclable_items: string; // JSON string
  how_to_prepare?: string;
  created_at: string | Date;
  updated_at: string | Date;
}

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
} 