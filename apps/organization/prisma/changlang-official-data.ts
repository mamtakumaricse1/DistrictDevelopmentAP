/**
 * Changlang master data transcribed from docs/Changlang Data.
 * Feed Changlang_District_Data-1 first (offices, sub-divisions, blocks, circles),
 * then apply Changlang_District_17_Circles_Coordinates onto the circles.
 */

export type OfficialDepartment = {
  code: string;
  name: string;
  shortName?: string;
  hodName?: string;
};

/** HOD offices from Changlang_District_Data-1, sheet "Departments". Codes already used by works stay fixed. */
export const OFFICIAL_DEPARTMENTS: OfficialDepartment[] = [
  { code: 'DC', name: 'DC Office, Changlang', hodName: 'Sri Rinchin Dorjee Thungon (Deputy Commissioner)' },
  { code: 'PR', name: 'Department of Panchayati Raj', hodName: 'Shri Marpe Riba (Additional Deputy Commissioner, HeadQuarter)' },
  { code: 'EST', name: 'Establishment', hodName: 'Shri Marpe Riba (Additional Deputy Commissioner, HeadQuarter)' },
  { code: 'DPO', name: 'District Planning Office', hodName: 'Smti Rosalind Pertin (Assistant Commissioner, Khimyang)' },
  { code: 'JAN', name: 'Jan Suvidha', hodName: 'Smti Rosalind Pertin (Assistant Commissioner, Khimyang)' },
  { code: 'ELE', name: 'Election', hodName: 'Shri Gamjar Doke (Assistant Commissioner, HeadQuarter)' },
  { code: 'JUD', name: 'Judicial', hodName: 'Shri Gamjar Doke (Assistant Commissioner, HeadQuarter)' },
  { code: 'WEL', name: 'Welfare', hodName: 'Shri Gamjar Doke (Assistant Commissioner, HeadQuarter)' },
  { code: 'JAIL', name: 'Jail Superintendent', hodName: 'Shri Gamjar Doke (Assistant Commissioner, HeadQuarter)' },
  { code: 'RD', name: 'Rural Development', shortName: 'RD', hodName: 'Deputy Director' },
  { code: 'NAZ', name: 'Nazrath', hodName: 'Shri Millo Uttung (Circle Officer, HeadQuarter)' },
  { code: 'GA', name: 'General Administration', hodName: 'Shri Millo Uttung (Circle Officer, HeadQuarter)' },
  { code: 'TM', name: 'Town Magistrate', hodName: 'Shri Millo Uttung (Circle Officer, HeadQuarter)' },
  { code: 'DEV', name: 'Development', hodName: 'Shri C.K. Namchoom (Circle Officer, Kantang)' },
  { code: 'TC', name: 'Trade & Commerce', hodName: 'Shri C.K. Namchoom (Circle Officer, Kantang)' },
  { code: 'ACNAMTOK', name: 'Assistant Commissioner, Namtok', hodName: 'Shri Mem Ejing (Assistant Commissioner, Namtok)' },
  { code: 'COYATDAM', name: 'Circle office, Yatdam', hodName: 'Dr. Ripi Doni (Circle Officer, Yatdam)' },
  { code: 'POL', name: 'Police', hodName: 'Shri Kirli Padu (Superintendent of Police)' },
  { code: 'FCS', name: 'Food & Civil Supplies Office', shortName: 'FCS', hodName: 'Shri Dekbom Boje (District Food & Civil Supply Officer)' },
  { code: 'TRY', name: 'Treasury Office', hodName: 'Shri Hage Tadii (Treasury Officer)' },
  { code: 'HLT', name: 'District Medical Office', shortName: 'Health', hodName: 'Dr. Neeba Lowang (District Medical Officer)' },
  { code: 'FOR', name: 'Forest', hodName: 'Shri P. Tangha (Divisional Forest Officer)' },
  { code: 'RWD', name: 'Rural Works Department', shortName: 'RWD', hodName: 'Er. C. Bangyang (Executive Engineer)' },
  { code: 'PMGSY', name: 'PMGSY DPIU-I', hodName: 'Er. H. Rekhung (Executive Engineer, PMGSY DPIU-I)' },
  { code: 'WRD', name: 'Water Resources Department', hodName: 'Er. Bising Darin (Executive Engineer)' },
  { code: 'PWD', name: 'Public Works Department', shortName: 'PWD', hodName: 'Er. Thangtit Tangha (Executive Engineer)' },
  { code: 'PHED', name: 'Public Health Engineering Department', shortName: 'PHED', hodName: 'Er. Bamang Tasung (Executive Engineer)' },
  { code: 'PWR', name: 'Electrical', shortName: 'Electrical', hodName: 'Er. N. Doji (Executive Engineer)' },
  { code: 'UD', name: 'Urban Development & Housing', shortName: 'UD', hodName: 'Er. Nich Jacob (Executive Engineer)' },
  { code: 'HYDRO', name: 'Department of Hydro Power Development', hodName: 'Er. J. Bam (Executive Engineer)' },
  { code: 'ICDS', name: 'Integrated Child Development Services', hodName: 'Shri Onyok Panyang (Deputy Director)' },
  { code: 'IND', name: 'Industries', hodName: 'Smti N. Mossang (Deputy Director)' },
  { code: 'AGR', name: 'Agriculture Office', shortName: 'Agriculture', hodName: 'Smti L.K. Taiju (District Agriculture Officer)' },
  { code: 'TEX', name: 'Textile & Handicraft', hodName: 'Smti Chaseng Sena (Assistant Director of Textile & Handicraft)' },
  { code: 'SER', name: 'Sericulture', hodName: 'Shri L. Bhupendro Singh (Assistant Director)' },
  { code: 'HOR', name: 'Horticulture', hodName: 'Shri Langhom Tangha (District Horticulture Officer)' },
  { code: 'VET', name: 'Vetenary', hodName: 'Dr. J.S. Mungrey (District Veterinary Officer)' },
  { code: 'EDU', name: 'Education', shortName: 'Education', hodName: 'Shri Rajiv Lomdak (Deputy Director of School Education)' },
  { code: 'DIET', name: 'DIET', hodName: 'Dr. Jeetendra Kr. Katiyar (Principal)' },
  { code: 'RFGC', name: 'Rang Frah Govt. College', hodName: 'Shri P. Mossang (Principal)' },
  { code: 'LIB', name: 'Liabrary', hodName: 'Shri S. Mamai (District Library & Information Officer)' },
  { code: 'FISH', name: 'Fisheries', hodName: 'Shri N. Longri (District Fisheries Development Officer)' },
  { code: 'DDMA', name: 'Disaster Management Office', hodName: 'Shri Lobsang (District Disaster Management Officer)' },
  { code: 'ECO', name: 'Economics & Statistics', hodName: 'Shri Kruleso Ngadong (Assistant Director)' },
  { code: 'LM', name: 'Legal Metrology', hodName: 'Shri Abom Apum (Assistant Controller)' },
  { code: 'CA', name: 'Consumer Affairs', hodName: 'Shri Abom Apum (Assistant Controller)' },
  { code: 'TAX', name: 'Tax, Excise & Narcotics', hodName: 'Shri Ngunwang Changmi (Superintendent)' },
  { code: 'RES', name: 'Research', hodName: 'Shri D. Yupang (District Research Officer)' },
  { code: 'LANG', name: 'Language', hodName: 'Smti L. Kenglang (Language Officer)' },
  { code: 'COOP', name: 'Co-Operative Society', hodName: 'Shri T. Byaling (ARCS)' },
  { code: 'TOUR', name: 'Tourism', hodName: 'Smti Eliza Nemsen Ruttum (Tourist Information Officer)' },
  { code: 'SPRT', name: 'Sports', hodName: 'Shri Kumar Doka (District Sports Officer)' },
  { code: 'EMP', name: 'Employement Matters', hodName: 'Shri Phassang Bhai (Assistant Employment Officer)' },
  { code: 'LAB', name: 'Labour Officer', hodName: 'Shri Phassang Bhai (Assistant Employment Officer)' },
  { code: 'TRN', name: 'Transport Office', shortName: 'Transport', hodName: 'Shri Halang Wangha (District Transport Officer)' },
  { code: 'FAO', name: 'Finance & Accounts Office', hodName: 'Shri Biplap Bhattacharjee (Finance & Accounts Officer, DC Office)' },
  { code: 'ART', name: 'District Art & Culture Office', hodName: 'Shri Dusu D Genda (District Art & Culture Officer)' },
  { code: 'MIN', name: 'Minerals/Mining/Geology/ Quarries', hodName: 'Shri Khilngam Tekhil (Assistant Mineral Development Officer)' },
  { code: 'NIC', name: 'National Informatics Centre', hodName: 'Shri Shiva Krishna (District Informatics Officer)' },
  { code: 'IT', name: 'IT & Communication', hodName: 'Shri Shiva Krishna (District Informatics Officer)' },
  { code: 'DIPR', name: 'District Information and Public Relations Office', hodName: 'Shri Shiva Krishna (District Informatics Officer)' },
  {
    code: 'APEDA',
    name: 'Agricultural and Processed Food Products Export Development',
    hodName: 'Er. Repu Haider (Project Officer, APEDA, Yatdam)',
  },
];

export type OfficialArea = {
  code: string;
  name: string;
  /** Existing seeded row to update, so works records that point at it keep resolving. */
  legacyId?: string;
};

export const SUBDIVISIONS: OfficialArea[] = [
  { code: 'CHANGLANG', name: 'Changlang' },
  { code: 'MIAO', name: 'Miao' },
  { code: 'JAIRAMPUR', name: 'Jairampur' },
  { code: 'BORDUMSA', name: 'Bordumsa' },
];

export type OfficialBlock = OfficialArea & { subdivision: string };

/** Nine blocks from Changlang_District_Data-1, sheet "Circles". */
export const OFFICIAL_BLOCKS: OfficialBlock[] = [
  { code: 'CHANGLANG', name: 'Changlang', subdivision: 'CHANGLANG', legacyId: '44444444-4444-4444-4444-000000000001' },
  { code: 'KHIMIYANG', name: 'Khimiyang', subdivision: 'CHANGLANG', legacyId: '44444444-4444-4444-4444-000000000005' },
  { code: 'YATDAM', name: 'Yatdam', subdivision: 'CHANGLANG' },
  { code: 'KHAGAM-MIAO', name: 'Khagam-Miao', subdivision: 'MIAO' },
  { code: 'VIJOYNAGAR', name: 'Vijoynagar', subdivision: 'MIAO' },
  { code: 'NAMPONG', name: 'Nampong', subdivision: 'JAIRAMPUR', legacyId: '44444444-4444-4444-4444-000000000004' },
  { code: 'MANMAO', name: 'Manmao', subdivision: 'JAIRAMPUR' },
  { code: 'BORDUMSA', name: 'Bordumsa', subdivision: 'BORDUMSA', legacyId: '44444444-4444-4444-4444-000000000006' },
  { code: 'DIYUN', name: 'Diyun', subdivision: 'BORDUMSA', legacyId: '44444444-4444-4444-4444-000000000007' },
];

export type OfficialCircle = OfficialArea & {
  subdivision: string;
  block: string | null;
  villages: number;
};

/** Seventeen circles from Changlang_District_Data-1. Coordinates are applied afterwards. */
export const OFFICIAL_CIRCLES: OfficialCircle[] = [
  { code: 'CHANGLANG', name: 'Changlang', subdivision: 'CHANGLANG', block: 'CHANGLANG', villages: 32 },
  { code: 'KHIMIYANG', name: 'Khimiyang', subdivision: 'CHANGLANG', block: 'KHIMIYANG', villages: 15 },
  { code: 'NAMTOK', name: 'Namtok', subdivision: 'CHANGLANG', block: null, villages: 18 },
  { code: 'YATDAM', name: 'Yatdam', subdivision: 'CHANGLANG', block: 'YATDAM', villages: 20 },
  { code: 'KANTANG', name: 'Kantang', subdivision: 'CHANGLANG', block: null, villages: 30 },
  { code: 'MIAO', name: 'Miao', subdivision: 'MIAO', block: 'KHAGAM-MIAO', villages: 37, legacyId: '44444444-4444-4444-4444-000000000002' },
  { code: 'KHARSANG', name: 'Kharsang', subdivision: 'MIAO', block: null, villages: 31, legacyId: '44444444-4444-4444-4444-000000000008' },
  { code: 'VIJOYNAGAR', name: 'Vijoynagar', subdivision: 'MIAO', block: 'VIJOYNAGAR', villages: 15 },
  { code: 'NAMPHAI-1', name: 'Namphai-1', subdivision: 'MIAO', block: null, villages: 11 },
  { code: 'JAIRAMPUR', name: 'Jairampur', subdivision: 'JAIRAMPUR', block: null, villages: 16, legacyId: '44444444-4444-4444-4444-000000000003' },
  { code: 'NAMPONG', name: 'Nampong', subdivision: 'JAIRAMPUR', block: 'NAMPONG', villages: 24 },
  { code: 'MANMAO', name: 'Manmao', subdivision: 'JAIRAMPUR', block: 'MANMAO', villages: 14 },
  { code: 'RIMA-PUTOK', name: 'Rima-Putok', subdivision: 'JAIRAMPUR', block: null, villages: 17 },
  { code: 'LYNGOK-LONGTOI', name: 'Lyngok-Longtoi', subdivision: 'JAIRAMPUR', block: null, villages: 7 },
  { code: 'RENUK', name: 'Renuk', subdivision: 'JAIRAMPUR', block: null, villages: 6 },
  { code: 'BORDUMSA', name: 'Bordumsa', subdivision: 'BORDUMSA', block: 'BORDUMSA', villages: 43 },
  { code: 'DIYUN', name: 'Diyun', subdivision: 'BORDUMSA', block: 'DIYUN', villages: 32 },
];

/** Changlang_District_17_Circles_Coordinates, sheet "17 Circles". Keyed by circle name. */
export const CIRCLE_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Changlang: { latitude: 27.178534, longitude: 95.751368 },
  Yatdam: { latitude: 27.081091, longitude: 95.688107 },
  Namtok: { latitude: 27.225949, longitude: 95.695421 },
  Khimiyang: { latitude: 26.966699, longitude: 95.71815 },
  Kantang: { latitude: 27.110862, longitude: 95.802783 },
  Miao: { latitude: 27.504448, longitude: 96.548396 },
  Kharsang: { latitude: 27.431717, longitude: 96.028466 },
  Vijoynagar: { latitude: 27.269097, longitude: 96.953159 },
  'Namphai-1': { latitude: 27.44354, longitude: 96.1006 },
  Jairampur: { latitude: 27.343039, longitude: 96.06157 },
  Nampong: { latitude: 27.287416, longitude: 96.119114 },
  'Rima-Putok': { latitude: 27.350026, longitude: 96.380829 },
  Manmao: { latitude: 27.249423, longitude: 95.954968 },
  'Lyngok-Longtoi': { latitude: 27.241816, longitude: 95.854674 },
  Renuk: { latitude: 27.107337, longitude: 95.931128 },
  Bordumsa: { latitude: 27.515, longitude: 95.8857 },
  Diyun: { latitude: 27.560951, longitude: 96.116877 },
};

/** Sample villages from the first seed. They are not in the official circle list. */
export const RETIRED_SAMPLE_VILLAGE_IDS = [
  '44444444-4444-4444-4444-000000000101',
  '44444444-4444-4444-4444-000000000102',
  '44444444-4444-4444-4444-000000000103',
  '44444444-4444-4444-4444-000000000104',
  '44444444-4444-4444-4444-000000000105',
  '44444444-4444-4444-4444-000000000106',
  '44444444-4444-4444-4444-000000000107',
  '44444444-4444-4444-4444-000000000108',
];
