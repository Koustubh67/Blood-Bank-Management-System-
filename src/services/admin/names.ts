import { cityById } from '@/data/cities'

/**
 * Name pools for the simulated staff register, by language region, so a
 * Kochi outlet is staffed by Malayali names and an Aizawl one by Mizo names,
 * with some colleagues from elsewhere (as in any Indian city).
 */
interface Pool {
  first: string[]
  last: string[]
}

const POOLS = {
  hindi: {
    first: ['Aarav', 'Rohit', 'Sandeep', 'Vikas', 'Amit', 'Pooja', 'Neha', 'Sunita', 'Rajesh', 'Manoj', 'Priyanka', 'Deepak', 'Anjali', 'Rakesh', 'Kavita', 'Arjun', 'Nisha', 'Saurabh', 'Ritu', 'Mohit', 'Shalini', 'Ajay', 'Sapna', 'Vivek'],
    last: ['Sharma', 'Verma', 'Yadav', 'Singh', 'Gupta', 'Mishra', 'Chauhan', 'Tiwari', 'Pandey', 'Saxena', 'Rawat', 'Meena', 'Joshi', 'Srivastava', 'Bhatt', 'Tomar', 'Rathore'],
  },
  urdu: { first: ['Imran', 'Farah', 'Salman', 'Ayesha', 'Zaid', 'Nazia', 'Faizan', 'Sana'], last: ['Qureshi', 'Khan', 'Ansari', 'Siddiqui', 'Shaikh', 'Hussain'] },
  punjabi: {
    first: ['Gurpreet', 'Harpreet', 'Manpreet', 'Jaspreet', 'Simran', 'Navjot', 'Amandeep', 'Harjit', 'Kuldeep', 'Baljit', 'Rupinder', 'Parminder'],
    last: ['Sandhu', 'Gill', 'Dhillon', 'Grewal', 'Brar', 'Sidhu', 'Bajwa', 'Randhawa', 'Kaur', 'Singh'],
  },
  marathi: {
    first: ['Sachin', 'Prasad', 'Sneha', 'Aditya', 'Rutuja', 'Omkar', 'Shruti', 'Tejas', 'Pranali', 'Vaibhav', 'Ketaki', 'Nilesh'],
    last: ['Patil', 'Deshmukh', 'Kulkarni', 'Jadhav', 'Pawar', 'Shinde', 'Gaikwad', 'More', 'Bhosale', 'Kale', 'Sawant'],
  },
  gujarati: {
    first: ['Hardik', 'Krunal', 'Dhruv', 'Hetal', 'Jignesh', 'Nirali', 'Parth', 'Bhavna', 'Chirag', 'Komal', 'Mihir', 'Riddhi'],
    last: ['Patel', 'Shah', 'Mehta', 'Desai', 'Parmar', 'Chaudhary', 'Trivedi', 'Solanki', 'Panchal'],
  },
  tamil: {
    first: ['Karthik', 'Lakshmi', 'Senthil', 'Divya', 'Arun', 'Meenakshi', 'Prakash', 'Kavya', 'Murugan', 'Revathi', 'Saravanan', 'Vignesh'],
    last: ['Subramanian', 'Krishnan', 'Raman', 'Natarajan', 'Selvam', 'Pandian', 'Rajan', 'Iyer', 'Velu', 'Shanmugam'],
  },
  telugu: {
    first: ['Srinivas', 'Ramya', 'Venkatesh', 'Swathi', 'Naveen', 'Lavanya', 'Kiran', 'Haritha', 'Suresh', 'Bhavani', 'Ravi', 'Sravani'],
    last: ['Reddy', 'Rao', 'Naidu', 'Chowdary', 'Varma', 'Goud', 'Raju', 'Prasad'],
  },
  kannada: {
    first: ['Manjunath', 'Shwetha', 'Raghavendra', 'Ananya', 'Darshan', 'Pallavi', 'Girish', 'Deepa', 'Harsha', 'Sowmya'],
    last: ['Gowda', 'Hegde', 'Shetty', 'Kamath', 'Bhat', 'Naik', 'Shenoy', 'Rao'],
  },
  malayali: {
    first: ['Anoop', 'Aswathy', 'Jithin', 'Neethu', 'Rahul', 'Anjali', 'Vishnu', 'Sreeja', 'Fathima', 'Tom', 'Divya', 'Akhil'],
    last: ['Nair', 'Menon', 'Pillai', 'Kurian', 'Thomas', 'Varghese', 'Joseph', 'Panicker', 'Mathew', 'Nambiar'],
  },
  bengali: {
    first: ['Arnab', 'Moumita', 'Sourav', 'Ananya', 'Debasish', 'Rituparna', 'Subhajit', 'Tanushree', 'Abhijit', 'Payel', 'Sayan', 'Mitali'],
    last: ['Banerjee', 'Chatterjee', 'Mukherjee', 'Das', 'Ghosh', 'Bose', 'Sen', 'Roy', 'Dutta', 'Mondal', 'Saha'],
  },
  tripuri: { first: ['Bijoy', 'Rupali', 'Sanjoy', 'Mampi', 'Pradyot', 'Jharna'], last: ['Debbarma', 'Jamatia', 'Reang', 'Tripura', 'Debnath'] },
  odia: {
    first: ['Subhasis', 'Lipika', 'Debashish', 'Sasmita', 'Pradeep', 'Sonali', 'Bikash', 'Itishree'],
    last: ['Mohanty', 'Panda', 'Sahoo', 'Behera', 'Nayak', 'Pradhan', 'Swain', 'Rout'],
  },
  assamese: {
    first: ['Bikram', 'Jonali', 'Pranjal', 'Dipshikha', 'Hemanta', 'Barnali', 'Rituraj', 'Nilakshi'],
    last: ['Bora', 'Kalita', 'Gogoi', 'Baruah', 'Saikia', 'Hazarika', 'Deka'],
  },
  bihari: {
    first: ['Ranjeet', 'Pinki', 'Sanjeev', 'Khushboo', 'Abhishek', 'Rekha', 'Chandan', 'Puja'],
    last: ['Kumar', 'Jha', 'Sinha', 'Prasad', 'Thakur', 'Pathak', 'Choudhary'],
  },
  mizo: { first: ['Lalremruata', 'Vanlalhriati', 'Lalthanpuia', 'Zothansangi', 'Lalrinfela', 'Malsawmi'], last: ['Ralte', 'Khiangte', 'Hmar', 'Chhakchhuak', 'Sailo', 'Pachuau'] },
  naga: { first: ['Neiphiu', 'Akum', 'Vikho', 'Kevi', 'Thejano', 'Imna'], last: ['Rio', 'Sangtam', 'Angami', 'Jamir', 'Lotha', 'Chishi'] },
  khasi: { first: ['Wanbok', 'Ibadahun', 'Banteilang', 'Daphisha', 'Kitboklang', 'Iohbor'], last: ['Kharkongor', 'Lyngdoh', 'Syiem', 'Marbaniang', 'Nongrum', 'Rymbai'] },
  manipuri: { first: ['Thoiba', 'Bijenti', 'Chingkhei', 'Sanatombi', 'Romesh', 'Linthoi'], last: ['Ningthoujam', 'Laishram', 'Moirangthem', 'Thangjam', 'Khumanthem'] },
  sikkimese: { first: ['Tenzing', 'Pema', 'Karma', 'Dawa', 'Yangchen', 'Nima'], last: ['Bhutia', 'Lepcha', 'Sherpa', 'Tamang', 'Gurung', 'Rai'] },
  arunachali: { first: ['Tage', 'Yarin', 'Doni', 'Toko', 'Kenjum', 'Yami'], last: ['Nabam', 'Tana', 'Riba', 'Pertin', 'Tamuk', 'Bagra'] },
  kashmiri: { first: ['Aamir', 'Saima', 'Irfan', 'Rukhsana', 'Bilal', 'Mehvish', 'Tariq', 'Shazia'], last: ['Bhat', 'Wani', 'Dar', 'Mir', 'Lone', 'Malik', 'Rather'] },
  ladakhi: { first: ['Stanzin', 'Tsering', 'Rigzin', 'Sonam', 'Jigmet', 'Padma'], last: ['Namgyal', 'Angmo', 'Dorjay', 'Lhamo', 'Wangchuk'] },
  goan: { first: ['Savio', 'Pooja', 'Joel', 'Shweta', 'Rohan', 'Clara', 'Siddhesh'], last: ['Fernandes', 'Naik', 'D’Souza', 'Kamat', 'Gaonkar', 'Pereira', 'Rodrigues'] },
} satisfies Record<string, Pool>

type Region = keyof typeof POOLS

const STATE_REGIONS: Record<string, Region[]> = {
  Delhi: ['hindi', 'punjabi', 'urdu', 'bihari'],
  Maharashtra: ['marathi'],
  Karnataka: ['kannada'],
  'Tamil Nadu': ['tamil'],
  Puducherry: ['tamil'],
  'West Bengal': ['bengali'],
  Tripura: ['tripuri', 'bengali'],
  Telangana: ['telugu', 'urdu'],
  'Andhra Pradesh': ['telugu'],
  Gujarat: ['gujarati'],
  'Dadra and Nagar Haveli and Daman and Diu': ['gujarati'],
  Rajasthan: ['hindi'],
  'Uttar Pradesh': ['hindi', 'urdu'],
  Haryana: ['hindi', 'punjabi'],
  'Madhya Pradesh': ['hindi'],
  Chhattisgarh: ['hindi'],
  Uttarakhand: ['hindi'],
  'Himachal Pradesh': ['hindi'],
  Jharkhand: ['hindi', 'bihari'],
  Chandigarh: ['punjabi', 'hindi'],
  Punjab: ['punjabi'],
  Bihar: ['bihari'],
  Odisha: ['odia'],
  Assam: ['assamese'],
  Kerala: ['malayali'],
  Lakshadweep: ['malayali'],
  Goa: ['goan'],
  'Jammu and Kashmir': ['kashmiri'],
  Ladakh: ['ladakhi'],
  Sikkim: ['sikkimese'],
  Meghalaya: ['khasi'],
  Manipur: ['manipuri'],
  Mizoram: ['mizo'],
  Nagaland: ['naga'],
  'Arunachal Pradesh': ['arunachali'],
  'Andaman and Nicobar Islands': ['tamil', 'bengali', 'telugu'],
}

/** Colleagues who moved for work: the regions most often seen far from home. */
const MOVERS: Region[] = ['hindi', 'bihari', 'bengali', 'malayali', 'odia', 'telugu']

const pick = <T,>(rand: () => number, list: readonly T[]) => list[Math.floor(rand() * list.length)]

export function staffName(rand: () => number, cityId: string) {
  const local = STATE_REGIONS[cityById(cityId).state] ?? ['hindi']
  const region = rand() < 0.78 ? pick(rand, local) : pick(rand, MOVERS)
  const pool: Pool = POOLS[region]
  return `${pick(rand, pool.first)} ${pick(rand, pool.last)}`
}

/** "R. Verma"-style patient label; never a full name on an ops screen. */
export function patientLabel(rand: () => number, cityId: string) {
  const [first, last] = staffName(rand, cityId).split(' ')
  return `${first[0]}. ${last}`
}

/** "+91 98•••• 4210" */
export function maskPhone(phone: string) {
  const d = phone.replace(/\D/g, '').slice(-10)
  return d.length === 10 ? `+91 ${d.slice(0, 2)}•••• ${d.slice(6)}` : phone
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] ?? '') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase()
}

/** "Imran Q." */
export function shortName(name: string) {
  const parts = name.trim().split(/\s+/)
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : name
}
