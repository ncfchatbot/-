
import { Grade, School, ProgramType, Subject, Chapter } from './types';

export const GRADES: Grade[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

export const SCHOOLS: School[] = [
  {
    id: 'satit-cu',
    name: 'โรงเรียนสาธิตจุฬาลงกรณ์มหาวิทยาลัย',
    affiliation: 'สพฐ.',
    programs: [ProgramType.Standard, ProgramType.Gifted]
  },
  {
    id: 'satit-psu',
    name: 'โรงเรียนสาธิตมหาวิทยาลัยศรีนครินทรวิโรฒ ประสานมิตร',
    affiliation: 'สพฐ.',
    programs: [ProgramType.Standard, ProgramType.EP]
  },
  {
    id: 'krungthep-christian',
    name: 'โรงเรียนกรุงเทพคริสเตียนวิทยาลัย',
    affiliation: 'เอกชน',
    programs: [ProgramType.Standard, ProgramType.EP]
  }
];

export const SUBJECTS: Subject[] = [
  { id: 'math', name: 'คณิตศาสตร์', nameEn: 'Mathematics' },
  { id: 'sci', name: 'วิทยาศาสตร์', nameEn: 'Science' },
  { id: 'eng', name: 'ภาษาอังกฤษ', nameEn: 'English' },
  { id: 'thai', name: 'ภาษาไทย', nameEn: 'Thai' }
];

export const CHAPTERS: Chapter[] = [
  { id: 'm1', subjectId: 'math', title: 'จำนวนนับ', titleEn: 'Counting Numbers' },
  { id: 'm2', subjectId: 'math', title: 'การบวก ลบ คูณ หาร', titleEn: 'Arithmetic' },
  { id: 's1', subjectId: 'sci', title: 'พืชและสัตว์', titleEn: 'Plants and Animals' },
  { id: 's2', subjectId: 'sci', title: 'ระบบสุริยะ', titleEn: 'Solar System' }
];
