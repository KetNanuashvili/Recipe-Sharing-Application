export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export interface Author {
  name: string;
  avatar?: string;
}



export interface Author {
  name: string;
  avatar?: string;
}

export interface Recipe {
  id: number | string;
  title: string;
  description: string;
  thumbnail?: string;
  isFavorite: boolean;

  // Core content:
  ingredients?: string[];
  instructions?: string;

  // UI helpers
  createdAt?: string | Date;
  timeMinutes?: number;
  servings?: number;
  difficulty?: Difficulty;
  rating?: number; // 0..5
  tags?: string[];
  author?: Author;
}
