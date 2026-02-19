import { BusService } from './types';

export const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzfq6ndYUjes9tZ7eqSFZtTISnRFaWLTovJVUJMHyOzssft96tYa0SyNMjQlo7e4JLVzw/exec";
export const ADMIN_WHATSAPP_NUMBER = "94701362527";
export const ADMIN_PASSWORD = "admin"; // Simple password for client-side protection

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
  "Sakeer Express": { name: "Sakeer Express", price: 2700, time: "9:00 PM" },
  "RS Express": { name: "RS Express", price: 2900, time: "9:00 PM" },
  "Myown Express": { name: "Myown Express", price: 2700, time: "8:45 PM" },
  "Al Ahla": { name: "Al Ahla", price: 2800, time: "8:30 PM" },
  "Al Rashith": { name: "Al Rashith", price: 2700, time: "8:00 PM" },
  "Star Travels": { name: "Star Travels", price: 1600, time: "9:30 PM" },
  "Lloyds Travels": { name: "Lloyds Travels", price: 2700, time: "9:00 PM" },
  "Super Line": { name: "Super Line", price: 2700, time: "9:00 PM" }
};