import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import type { College, Review, Question, Answer } from "./types";

let db: Database.Database | null = null;

interface SeedShape {
  colleges: College[];
  reviews: Review[];
  questions: Question[];
  answers: Answer[];
}

function buildSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS colleges (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      type TEXT NOT NULL,
      stream TEXT NOT NULL,
      established INTEGER NOT NULL,
      rating REAL NOT NULL,
      reviewCount INTEGER NOT NULL,
      annualFee INTEGER NOT NULL,
      naacGrade TEXT NOT NULL,
      nirfRank INTEGER,
      exams TEXT NOT NULL,
      overview TEXT NOT NULL,
      campusSizeAcres INTEGER NOT NULL,
      hostelAvailable INTEGER NOT NULL,
      courses TEXT NOT NULL,
      placements TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS reviews (
      id INTEGER PRIMARY KEY,
      collegeId INTEGER NOT NULL,
      author TEXT NOT NULL,
      batch TEXT NOT NULL,
      rating REAL NOT NULL,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (collegeId) REFERENCES colleges(id)
    );
    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      body TEXT NOT NULL,
      author TEXT NOT NULL,
      tags TEXT NOT NULL,
      collegeId INTEGER,
      createdAt TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY,
      questionId INTEGER NOT NULL,
      author TEXT NOT NULL,
      body TEXT NOT NULL,
      upvotes INTEGER NOT NULL DEFAULT 0,
      createdAt TEXT NOT NULL,
      FOREIGN KEY (questionId) REFERENCES questions(id)
    );
    CREATE INDEX IF NOT EXISTS idx_colleges_stream ON colleges(stream);
    CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
    CREATE INDEX IF NOT EXISTS idx_reviews_college ON reviews(collegeId);
    CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(questionId);
  `);
}

function seed(database: Database.Database) {
  const count = (database.prepare("SELECT COUNT(*) AS c FROM colleges").get() as { c: number }).c;
  if (count > 0) return;

  const seedPath = path.join(process.cwd(), "src", "lib", "seed.json");
  const raw = JSON.parse(fs.readFileSync(seedPath, "utf-8")) as SeedShape;

  const insertCollege = database.prepare(`
    INSERT INTO colleges (id,name,slug,city,state,type,stream,established,rating,reviewCount,
      annualFee,naacGrade,nirfRank,exams,overview,campusSizeAcres,hostelAvailable,courses,placements)
    VALUES (@id,@name,@slug,@city,@state,@type,@stream,@established,@rating,@reviewCount,
      @annualFee,@naacGrade,@nirfRank,@exams,@overview,@campusSizeAcres,@hostelAvailable,@courses,@placements)
  `);
  const insertReview = database.prepare(`
    INSERT INTO reviews (id,collegeId,author,batch,rating,title,body,createdAt)
    VALUES (@id,@collegeId,@author,@batch,@rating,@title,@body,@createdAt)
  `);
  const insertQuestion = database.prepare(`
    INSERT INTO questions (id,title,body,author,tags,collegeId,createdAt)
    VALUES (@id,@title,@body,@author,@tags,@collegeId,@createdAt)
  `);
  const insertAnswer = database.prepare(`
    INSERT INTO answers (id,questionId,author,body,upvotes,createdAt)
    VALUES (@id,@questionId,@author,@body,@upvotes,@createdAt)
  `);

  const tx = database.transaction(() => {
    for (const c of raw.colleges) {
      insertCollege.run({
        ...c,
        nirfRank: c.nirfRank ?? null,
        hostelAvailable: c.hostelAvailable ? 1 : 0,
        exams: JSON.stringify(c.exams),
        courses: JSON.stringify(c.courses),
        placements: JSON.stringify(c.placements),
      });
    }
    for (const r of raw.reviews) insertReview.run(r);
    for (const q of raw.questions) {
      insertQuestion.run({ ...q, collegeId: q.collegeId ?? null, tags: JSON.stringify(q.tags) });
    }
    for (const a of raw.answers) insertAnswer.run(a);
  });
  tx();
}

export function getDb(): Database.Database {
  if (db) return db;
  const file = path.join(process.cwd(), "college.db");
  db = new Database(file);
  db.pragma("journal_mode = WAL");
  buildSchema(db);
  seed(db);
  return db;
}

type CollegeRow = Omit<College, "exams" | "courses" | "placements" | "hostelAvailable"> & {
  exams: string;
  courses: string;
  placements: string;
  hostelAvailable: number;
};

export function hydrateCollege(row: CollegeRow): College {
  return {
    ...row,
    hostelAvailable: !!row.hostelAvailable,
    exams: JSON.parse(row.exams),
    courses: JSON.parse(row.courses),
    placements: JSON.parse(row.placements),
  };
}

export function hydrateQuestion(row: Omit<Question, "tags" | "answerCount"> & { tags: string }): Omit<Question, "answerCount"> {
  return { ...row, tags: JSON.parse(row.tags) };
}
