export type Media = {
  id: string;
  filename: string;
  originalname: string;
  type: 'image' | 'video';
  url: string;
  uploaded_by: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      media: {
        Row: Media;
        Insert: Omit<Media, 'id' | 'created_at'>;
        Update: Partial<Omit<Media, 'id' | 'created_at'>>;
      };
    };
  };
}; 