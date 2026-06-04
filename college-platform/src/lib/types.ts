export interface Course {
  name: string;
  degree: string;
  durationYears: number;
  annualFee: number;
  seats: number;
}

export interface PlacementYear {
  year: number;
  avgPackageLpa: number;
  highestPackageLpa: number;
  placementRate: number;
  topRecruiters: string[];
}

export interface Review {
  id: number;
  collegeId: number;
  author: string;
  batch: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
}

export interface College {
  id: number;
  name: string;
  slug: string;
  city: string;
  state: string;
  type: "Government" | "Private" | "Deemed";
  stream: string;
  established: number;
  rating: number;
  reviewCount: number;
  annualFee: number;
  naacGrade: string;
  nirfRank: number | null;
  exams: string[];
  overview: string;
  campusSizeAcres: number;
  hostelAvailable: boolean;
  courses: Course[];
  placements: PlacementYear[];
}

export interface Question {
  id: number;
  title: string;
  body: string;
  author: string;
  tags: string[];
  collegeId: number | null;
  createdAt: string;
  answerCount: number;
}

export interface Answer {
  id: number;
  questionId: number;
  author: string;
  body: string;
  upvotes: number;
  createdAt: string;
}
