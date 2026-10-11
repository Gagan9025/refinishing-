/**
 * Mock Data Repository
 * 
 * FUTURE FIREBASE NOTE:
 * In Stage 2, these collections map directly to Firestore documents:
 * - dailyTargets -> collection('dailyTargets')
 * - hourlyProduction -> collection('hourlyProduction')
 * - batchProduction -> collection('batchProduction')
 * - vehicleLoading -> collection('vehicleLoading')
 * - vehicleUnloading -> collection('vehicleUnloading')
 * - attendance -> collection('attendance')
 * - seenRecords -> collection('seenRecords')
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

export const INITIAL_DAILY_TARGETS = [
  {
    id: 'target_2026-10-11',
    date: '2026-10-11',
    scanningTarget: 1000,
    batchTarget: 500,
    createdAt: '2026-10-11T08:15:00Z',
    updatedAt: '2026-10-11T08:15:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'target_2026-10-10',
    date: '2026-10-10',
    scanningTarget: 1000,
    batchTarget: 500,
    createdAt: '2026-10-10T08:10:00Z',
    updatedAt: '2026-10-10T08:10:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }
];

export const INITIAL_HOURLY_PRODUCTION = [
  // 11-Oct-2026
  {
    id: 'hp_2026-10-11_1',
    date: '2026-10-11',
    hour: '8:30 – 9:30',
    target: 125,
    achieved: 130,
    difference: 5,
    achievementPercentage: 104.0,
    status: 'Above Target',
    remarks: 'Smooth startup, prime conveyor line running optimal',
    isUpdated: true,
    createdAt: '2026-10-11T09:35:00Z',
    updatedAt: '2026-10-11T09:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-11_2',
    date: '2026-10-11',
    hour: '9:30 – 10:30',
    target: 125,
    achieved: 125,
    difference: 0,
    achievementPercentage: 100.0,
    status: 'On Target',
    remarks: 'Consistent cycle pace',
    isUpdated: true,
    createdAt: '2026-10-11T10:33:00Z',
    updatedAt: '2026-10-11T10:33:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-11_3',
    date: '2026-10-11',
    hour: '10:30 – 11:30',
    target: 125,
    achieved: 110,
    difference: -15,
    achievementPercentage: 88.0,
    status: 'Below Target',
    remarks: 'Slight fixture alignment recalibration during mid-run',
    isUpdated: true,
    createdAt: '2026-10-11T11:32:00Z',
    updatedAt: '2026-10-11T11:32:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-11_4',
    date: '2026-10-11',
    hour: '11:30 – 12:30',
    target: 125,
    achieved: 128,
    difference: 3,
    achievementPercentage: 102.4,
    status: 'Above Target',
    remarks: 'Speed recovered prior to lunch break',
    isUpdated: true,
    createdAt: '2026-10-11T12:32:00Z',
    updatedAt: '2026-10-11T12:32:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-11_5',
    date: '2026-10-11',
    hour: '1:00 – 2:00',
    target: 125,
    achieved: 122,
    difference: -3,
    achievementPercentage: 97.6,
    status: 'Below Target',
    remarks: 'Post-lunch restart',
    isUpdated: true,
    createdAt: '2026-10-11T14:02:00Z',
    updatedAt: '2026-10-11T14:02:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-11_6',
    date: '2026-10-11',
    hour: '2:00 – 3:00',
    target: 125,
    achieved: 0,
    difference: 0,
    achievementPercentage: 0,
    status: 'Not Updated',
    remarks: '',
    isUpdated: false,
    createdAt: '2026-10-11T08:00:00Z',
    updatedAt: '2026-10-11T08:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'hp_2026-10-11_7',
    date: '2026-10-11',
    hour: '3:00 – 4:00',
    target: 125,
    achieved: 0,
    difference: 0,
    achievementPercentage: 0,
    status: 'Not Updated',
    remarks: '',
    isUpdated: false,
    createdAt: '2026-10-11T08:00:00Z',
    updatedAt: '2026-10-11T08:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  },
  {
    id: 'hp_2026-10-11_8',
    date: '2026-10-11',
    hour: '4:00 – 5:00',
    target: 125,
    achieved: 0,
    difference: 0,
    achievementPercentage: 0,
    status: 'Not Updated',
    remarks: '',
    isUpdated: false,
    createdAt: '2026-10-11T08:00:00Z',
    updatedAt: '2026-10-11T08:00:00Z',
    createdBy: 'system',
    updatedBy: 'system'
  },

  // 10-Oct-2026 (Completed day matching prompt's 920 achieved)
  {
    id: 'hp_2026-10-10_1',
    date: '2026-10-10',
    hour: '8:30 – 9:30',
    target: 125,
    achieved: 115,
    difference: -10,
    achievementPercentage: 92.0,
    status: 'Below Target',
    remarks: 'Startup run',
    isUpdated: true,
    createdAt: '2026-10-10T09:35:00Z',
    updatedAt: '2026-10-10T09:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_2',
    date: '2026-10-10',
    hour: '9:30 – 10:30',
    target: 125,
    achieved: 120,
    difference: -5,
    achievementPercentage: 96.0,
    status: 'Below Target',
    remarks: 'Normal run',
    isUpdated: true,
    createdAt: '2026-10-10T10:35:00Z',
    updatedAt: '2026-10-10T10:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_3',
    date: '2026-10-10',
    hour: '10:30 – 11:30',
    target: 125,
    achieved: 125,
    difference: 0,
    achievementPercentage: 100.0,
    status: 'On Target',
    remarks: 'Target achieved',
    isUpdated: true,
    createdAt: '2026-10-10T11:35:00Z',
    updatedAt: '2026-10-10T11:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_4',
    date: '2026-10-10',
    hour: '11:30 – 12:30',
    target: 125,
    achieved: 118,
    difference: -7,
    achievementPercentage: 94.4,
    status: 'Below Target',
    remarks: 'Minor part stoppage',
    isUpdated: true,
    createdAt: '2026-10-10T12:35:00Z',
    updatedAt: '2026-10-10T12:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_5',
    date: '2026-10-10',
    hour: '1:00 – 2:00',
    target: 125,
    achieved: 112,
    difference: -13,
    achievementPercentage: 89.6,
    status: 'Below Target',
    remarks: 'Lunch transition',
    isUpdated: true,
    createdAt: '2026-10-10T14:05:00Z',
    updatedAt: '2026-10-10T14:05:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_6',
    date: '2026-10-10',
    hour: '2:00 – 3:00',
    target: 125,
    achieved: 115,
    difference: -10,
    achievementPercentage: 92.0,
    status: 'Below Target',
    remarks: 'Standard rate',
    isUpdated: true,
    createdAt: '2026-10-10T15:05:00Z',
    updatedAt: '2026-10-10T15:05:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_7',
    date: '2026-10-10',
    hour: '3:00 – 4:00',
    target: 125,
    achieved: 110,
    difference: -15,
    achievementPercentage: 88.0,
    status: 'Below Target',
    remarks: 'Line 2 maintenance check',
    isUpdated: true,
    createdAt: '2026-10-10T16:05:00Z',
    updatedAt: '2026-10-10T16:05:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'hp_2026-10-10_8',
    date: '2026-10-10',
    hour: '4:00 – 5:00',
    target: 125,
    achieved: 105,
    difference: -20,
    achievementPercentage: 84.0,
    status: 'Below Target',
    remarks: 'End-of-day wash and wipe',
    isUpdated: true,
    createdAt: '2026-10-10T17:05:00Z',
    updatedAt: '2026-10-10T17:05:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }
];

export const INITIAL_BATCH_PRODUCTION = [
  {
    id: 'batch_2026-10-11_1',
    date: '2026-10-11',
    hour: '9:30 – 10:30',
    batchQuantity: 110,
    remarks: 'Batch #B-2026-091 Satin Matt',
    createdAt: '2026-10-11T10:30:00Z',
    updatedAt: '2026-10-11T10:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'batch_2026-10-11_2',
    date: '2026-10-11',
    hour: '11:30 – 12:30',
    batchQuantity: 135,
    remarks: 'Batch #B-2026-092 Metallic Gloss',
    createdAt: '2026-10-11T12:30:00Z',
    updatedAt: '2026-10-11T12:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'batch_2026-10-11_3',
    date: '2026-10-11',
    hour: '1:00 – 2:00',
    batchQuantity: 95,
    remarks: 'Batch #B-2026-093 Clear Coat Top',
    createdAt: '2026-10-11T14:00:00Z',
    updatedAt: '2026-10-11T14:00:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },

  // 10-Oct-2026 (matching prompt's 470 total achieved)
  {
    id: 'batch_2026-10-10_1',
    date: '2026-10-10',
    hour: '9:30 – 10:30',
    batchQuantity: 150,
    remarks: 'Primer Surface Batch #A1',
    createdAt: '2026-10-10T10:30:00Z',
    updatedAt: '2026-10-10T10:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'batch_2026-10-10_2',
    date: '2026-10-10',
    hour: '11:30 – 12:30',
    batchQuantity: 160,
    remarks: 'Base Color Black Batch #A2',
    createdAt: '2026-10-10T12:30:00Z',
    updatedAt: '2026-10-10T12:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'batch_2026-10-10_3',
    date: '2026-10-10',
    hour: '3:00 – 4:00',
    batchQuantity: 160,
    remarks: 'Protective Lacquer Batch #A3',
    createdAt: '2026-10-10T16:00:00Z',
    updatedAt: '2026-10-10T16:00:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }
];

export const INITIAL_VEHICLE_UNLOADING = [
  // 11-Oct-2026
  {
    id: 'unloading_2026-10-11_1',
    date: '2026-10-11',
    time: '08:45 AM',
    vehicleNumber: 'MH-12-RN-4821',
    driverName: 'Kishore Patil',
    boxes: 45,
    quantity: 900,
    source: 'Vendor Plant 1 (Pune)',
    remarks: 'Raw unpainted panels - QC Gate passed',
    createdAt: '2026-10-11T08:50:00Z',
    updatedAt: '2026-10-11T08:50:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'unloading_2026-10-11_2',
    date: '2026-10-11',
    time: '11:15 AM',
    vehicleNumber: 'MH-14-BT-9304',
    driverName: 'Suresh More',
    boxes: 35,
    quantity: 700,
    source: 'Foundry Depot (Chakan)',
    remarks: 'Refinishing moldings, sealed cartons',
    createdAt: '2026-10-11T11:20:00Z',
    updatedAt: '2026-10-11T11:20:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },

  // 10-Oct-2026 (matching prompt's 4 vehicles, 120 boxes, 2400 quantity)
  {
    id: 'unloading_2026-10-10_1',
    date: '2026-10-10',
    time: '09:00 AM',
    vehicleNumber: 'MH-12-AB-1111',
    driverName: 'R. K. Yadav',
    boxes: 30,
    quantity: 600,
    source: 'Supplier Alpha',
    remarks: 'Palletized',
    createdAt: '2026-10-10T09:10:00Z',
    updatedAt: '2026-10-10T09:10:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'unloading_2026-10-10_2',
    date: '2026-10-10',
    time: '11:30 AM',
    vehicleNumber: 'MH-12-CD-2222',
    driverName: 'D. M. Shinde',
    boxes: 30,
    quantity: 600,
    source: 'Supplier Beta',
    remarks: 'Clearance verified',
    createdAt: '2026-10-10T11:35:00Z',
    updatedAt: '2026-10-10T11:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'unloading_2026-10-10_3',
    date: '2026-10-10',
    time: '02:00 PM',
    vehicleNumber: 'MH-14-EF-3333',
    driverName: 'Vikas Jagtap',
    boxes: 30,
    quantity: 600,
    source: 'Supplier Gamma',
    remarks: 'All okay',
    createdAt: '2026-10-10T14:10:00Z',
    updatedAt: '2026-10-10T14:10:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'unloading_2026-10-10_4',
    date: '2026-10-10',
    time: '04:15 PM',
    vehicleNumber: 'MH-12-GH-4444',
    driverName: 'Anil Thorat',
    boxes: 30,
    quantity: 600,
    source: 'Supplier Delta',
    remarks: 'Last incoming inward',
    createdAt: '2026-10-10T16:20:00Z',
    updatedAt: '2026-10-10T16:20:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }
];

export const INITIAL_VEHICLE_LOADING = [
  // 11-Oct-2026
  {
    id: 'loading_2026-10-11_1',
    date: '2026-10-11',
    time: '10:00 AM',
    vehicleNumber: 'MH-12-LK-5502',
    driverName: 'Mahesh Gaikwad',
    boxes: 40,
    quantity: 800,
    destination: 'Assembly Line 3 (OEM Plant)',
    remarks: 'Priority dispatch for day shift assembly',
    createdAt: '2026-10-11T10:10:00Z',
    updatedAt: '2026-10-11T10:10:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'loading_2026-10-11_2',
    date: '2026-10-11',
    time: '01:45 PM',
    vehicleNumber: 'MH-14-XY-8812',
    driverName: 'Ganesh Bhise',
    boxes: 25,
    quantity: 500,
    destination: 'Central Finished Goods Warehouse',
    remarks: 'Polished bumpers & side skins',
    createdAt: '2026-10-11T13:50:00Z',
    updatedAt: '2026-10-11T13:50:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },

  // 10-Oct-2026 (matching prompt's 3 vehicles, 90 boxes, 1800 quantity)
  {
    id: 'loading_2026-10-10_1',
    date: '2026-10-10',
    time: '11:00 AM',
    vehicleNumber: 'MH-12-AA-9001',
    driverName: 'N. S. Joshi',
    boxes: 30,
    quantity: 600,
    destination: 'OEM Main Plant',
    remarks: 'Dispatched on schedule',
    createdAt: '2026-10-10T11:05:00Z',
    updatedAt: '2026-10-10T11:05:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'loading_2026-10-10_2',
    date: '2026-10-10',
    time: '01:30 PM',
    vehicleNumber: 'MH-12-BB-9002',
    driverName: 'H. T. Deshmukh',
    boxes: 30,
    quantity: 600,
    destination: 'Warehouse North',
    remarks: 'Dispatched with QA sticker',
    createdAt: '2026-10-10T13:35:00Z',
    updatedAt: '2026-10-10T13:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  },
  {
    id: 'loading_2026-10-10_3',
    date: '2026-10-10',
    time: '04:30 PM',
    vehicleNumber: 'MH-12-CC-9003',
    driverName: 'P. R. Kulkarni',
    boxes: 30,
    quantity: 600,
    destination: 'Aftermarket Spares Hub',
    remarks: 'Final dispatch',
    createdAt: '2026-10-10T16:35:00Z',
    updatedAt: '2026-10-10T16:35:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }
];

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

// Generate attendance for 2026-10-11 (24 Present, 1 Absent) and 2026-10-10 (23 Present, 2 Absent)
export const INITIAL_ATTENDANCE = [
  ...INITIAL_EMPLOYEES.map((emp, idx) => ({
    id: `att_2026-10-11_${emp.id}`,
    date: '2026-10-11',
    employeeId: emp.id,
    employeeName: emp.name,
    status: idx === 12 ? 'Absent' : 'Present', // 24 Present, 1 Absent
    createdAt: '2026-10-11T08:30:00Z',
    updatedAt: '2026-10-11T08:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  })),
  ...INITIAL_EMPLOYEES.map((emp, idx) => ({
    id: `att_2026-10-10_${emp.id}`,
    date: '2026-10-10',
    employeeId: emp.id,
    employeeName: emp.name,
    status: idx === 4 || idx === 18 ? 'Absent' : 'Present', // 23 Present, 2 Absent (matches prompt's summary)
    createdAt: '2026-10-10T08:30:00Z',
    updatedAt: '2026-10-10T08:30:00Z',
    createdBy: 'entry',
    updatedBy: 'entry'
  }))
];

export const INITIAL_SEEN_RECORDS = [
  {
    id: 'seen_1',
    viewerId: 'V001',
    viewerName: 'Sunil Verma (Supervisor)',
    date: '2026-10-11',
    module: 'Hourly Scanning',
    hour: '8:30 – 9:30',
    viewedAt: '2026-10-11T09:40:00Z'
  },
  {
    id: 'seen_2',
    viewerId: 'V002',
    viewerName: 'D. K. Singhal (HOD Operations)',
    date: '2026-10-11',
    module: 'Hourly Scanning',
    hour: '11:30 – 12:30',
    viewedAt: '2026-10-11T12:45:00Z'
  },
  {
    id: 'seen_3',
    viewerId: 'V001',
    viewerName: 'Sunil Verma (Supervisor)',
    date: '2026-10-11',
    module: 'Hourly Scanning',
    hour: '1:00 – 2:00',
    viewedAt: '2026-10-11T14:15:00Z'
  },
  {
    id: 'seen_4',
    viewerId: 'V002',
    viewerName: 'D. K. Singhal (HOD Operations)',
    date: '2026-10-10',
    module: 'Hourly Scanning',
    hour: '4:00 – 5:00',
    viewedAt: '2026-10-10T17:15:00Z'
  }
];
