import { BusService } from './types';

export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBlzuia5XCA5C0u3GUf6ilXIHet7d6euc5LVF4YK_0uoUeyAI0XQWvrhn0aI2jfctJ7A/exec";
export const ADMIN_WHATSAPP_NUMBER = "94777402886";
export const ADMIN_PASSWORD = "admin"; // Primary Password
export const ADMIN_SECURITY_PIN = "1123"; // Secondary Verification PIN

export const BANK_DETAILS = {
  bankName: "Hatton National Bank (HNB)",
  accountName: "MOHAMED FAWAS MT",
  accountNumber: "159020046687",
  branch: "Nintavur Branch",
  reference: "Your Name + Phone"
};

export const CITIES = [
  "Sammanthurai", "Nintavur", "Kalmunai", "Maruthamunai", 
  "Batticaloa", "Polonaruwa", "Kattunayaka Airport", "Akkaraipattu", 
  "Colombo", "Orugudwaththa", "Wellampitiya", "Kolonnawa", 
  "Rajagiriya", "Mardana", "Kolluppitiya", "Wellwaththa", "Dehiwala"
];

export const BUS_SERVICES: Record<string, BusService> = {
  "Sakeer Express": { name: "Sakeer Express", price: 2700, time: "9:00 PM", quota: 10 },
  "RS Express": { name: "RS Express", price: 2900, time: "9:00 PM", quota: 10 },
  "Myown Express": { name: "Myown Express", price: 2700, time: "8:45 PM", quota: 10 },
  "Al Ahla": { name: "Al Ahla", price: 2800, time: "8:30 PM", quota: 10 },
  "Al Rashith": { name: "Al Rashith", price: 2700, time: "8:00 PM", quota: 10 },
  "Star Travels": { name: "Star Travels", price: 1600, time: "9:30 PM", quota: 10 },
  "Lloyds Travels": { name: "Lloyds Travels", price: 2700, time: "9:00 PM", quota: 10 },
  "Super Line": { name: "Super Line", price: 2800, time: "9:00 PM", quota: 10 },
  "RN Express": { name: "RN Express", price: 2500, time: "8:30 PM", quota: 10 },
  "Anaaf Travels": { name: "Anaaf Travels", price: 2700, time: "9:00 PM", quota: 10 }
};