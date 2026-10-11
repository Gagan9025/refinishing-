/**
 * Mock Data Repository (Clean State - Ready for Live Production Entry)
 * Production is measured in Pieces (Pcs).
 */

export const INITIAL_USERS = [
  {
    id: 'usr_entry',
    username: 'entry',
    password: 'entry123',
    name: 'Rajesh Sharma',
    role: 'DATA ENTRY',
    department: 'Refinishing Dept'
  },
  {
    id: 'usr_viewer',
    username: 'viewer',
    password: 'viewer123',
    name: 'Sunil Verma (Supervisor)',
    role: 'VIEWER',
    department: 'Plant Operations / Quality'
  }
];

// Master list of department employees for attendance roster
export const INITIAL_EMPLOYEES = [
  { id: 'EMP-01', name: 'Amit Sawant' },
  { id: 'EMP-02', name: 'Balu Shinde' },
  { id: 'EMP-03', name: 'Chetan Jadhav' },
  { id: 'EMP-04', name: 'Deepak Mane' },
  { id: 'EMP-05', name: 'Eknath Pawar' },
  { id: 'EMP-06', name: 'Farhan Shaikh' },
  { id: 'EMP-07', name: 'Gopal Kale' },
  { id: 'EMP-08', name: 'Harish Rane' },
  { id: 'EMP-09', name: 'Indrajeet Kadam' },
  { id: 'EMP-10', name: 'Jayant Mohite' },
  { id: 'EMP-11', name: 'Kiran Sonawane' },
  { id: 'EMP-12', name: 'Laxman Gite' },
  { id: 'EMP-13', name: 'Manoj Salve' },
  { id: 'EMP-14', name: 'Nitin Chavan' },
  { id: 'EMP-15', name: 'Omkar Raut' },
  { id: 'EMP-16', name: 'Pradeep Kamble' },
  { id: 'EMP-17', name: 'Rahul More' },
  { id: 'EMP-18', name: 'Sachin Gaikwad' },
  { id: 'EMP-19', name: 'Tanaji Jagtap' },
  { id: 'EMP-20', name: 'Umesh Bhosale' },
  { id: 'EMP-21', name: 'Vijay Ghodke' },
  { id: 'EMP-22', name: 'Wasim Mansoori' },
  { id: 'EMP-23', name: 'Yogesh Tambe' },
  { id: 'EMP-24', name: 'Zameer Khan' },
  { id: 'EMP-25', name: 'Aniket Waghmare' }
];

// Clean initial states - ready for user to enter fresh live data
export const INITIAL_DAILY_TARGETS = [];
export const INITIAL_HOURLY_PRODUCTION = [];
export const INITIAL_BATCH_PRODUCTION = [];
export const INITIAL_VEHICLE_UNLOADING = [];
export const INITIAL_VEHICLE_LOADING = [];
export const INITIAL_ATTENDANCE = [];
export const INITIAL_SEEN_RECORDS = [];
