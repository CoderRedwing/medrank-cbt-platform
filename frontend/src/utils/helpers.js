/** Merge class names (simple clsx-lite) */
export const cx = (...args) =>
  args.flat().filter(Boolean).join(' ');

/** Format seconds → mm:ss or hh:mm:ss */
export const formatTime = (totalSeconds) => {
  if (totalSeconds < 0) totalSeconds = 0;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/** Format minutes → "3h 30m" */
export const formatMinutes = (mins) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
};

/** Accuracy color class */
export const accuracyColor = (pct) => {
  if (pct >= 75) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

/** Score percentage color */
export const scoreColor = (pct) => {
  if (pct >= 70) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  if (pct >= 30) return '#fb923c';
  return '#ef4444';
};

/** Difficulty badge color */
export const difficultyColor = (diff) => {
  const map = {
    Easy:      { bg: 'rgba(16,185,129,.15)', text: '#10b981' },
    Moderate:  { bg: 'rgba(59,130,246,.15)', text: '#60a5fa' },
    Hard:      { bg: 'rgba(245,158,11,.15)', text: '#fbbf24' },
    'Very Hard':{ bg: 'rgba(239,68,68,.15)', text: '#f87171' },
  };
  return map[diff] || map.Moderate;
};

/** Truncate text */
export const truncate = (str, max = 60) =>
  str?.length > max ? str.slice(0, max) + '…' : str;

/** Subject to short code */
export const subjectCode = (subj) => {
  const map = {
    Medicine: 'MED', Surgery: 'SUR', Pathology: 'PATH',
    Pharmacology: 'PHARM', Microbiology: 'MICRO', OBGYN: 'OBG',
    Pediatrics: 'PEDS', PSM: 'PSM', Anatomy: 'ANAT',
    Physiology: 'PHYS', Biochemistry: 'BIO', ENT: 'ENT',
    Ophthalmology: 'OPHTH', Orthopedics: 'ORTHO', Psychiatry: 'PSY',
    Radiology: 'RAD', Anaesthesia: 'ANAES', Dermatology: 'DERM',
    'Forensic Medicine': 'FM',
  };
  return map[subj] || subj?.slice(0, 4).toUpperCase();
};

/** Get priority badge style */
export const priorityStyle = (priority) => {
  const map = {
    critical: { bg: 'rgba(239,68,68,.2)',   text: '#f87171',  label: 'Critical' },
    high:     { bg: 'rgba(245,158,11,.2)',  text: '#fbbf24',  label: 'High' },
    medium:   { bg: 'rgba(99,102,241,.2)', text: '#818cf8',  label: 'Medium' },
  };
  return map[priority] || map.medium;
};
