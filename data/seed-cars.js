const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Car = require("../models/Car");
const User = require("../models/User");

dotenv.config({ path: "./config.env" });

const carsData = [
  // Toyota
  {
    title: "2023 Toyota Camry",
    description:
      "Brand new Toyota Camry with all features including leather seats, sunroof, and premium sound system.",
    price: 35000000,
    make: "Toyota",
    model: "Camry",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244], // [lng, lat]
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Airbags", value: "Yes" },
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
    ],
    testDriveAvailable: true,
    financingAvailable: true,
  },
  {
    title: "2022 Toyota Corolla",
    description:
      "Well-maintained Toyota Corolla with low mileage and excellent fuel economy.",
    price: 22000000,
    make: "Toyota",
    model: "Corolla",
    year: 2022,
    mileage: 15000,
    condition: "used",
    transmission: "manual",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1623869675781-4e0d2f5c2d8f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
    ],
  },
  {
    title: "2023 Toyota RAV4",
    description:
      "Spacious Toyota RAV4 SUV, perfect for family trips and city driving.",
    price: 40000000,
    make: "Toyota",
    model: "RAV4",
    year: 2023,
    mileage: 5000,
    condition: "certified_pre_owned",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578844251758-2f71da64c8fe",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Airbags", value: "Yes" },
      { name: "4WD", value: "Yes" },
      { name: "Roof Rack", value: "Yes" },
    ],
  },
  {
    title: "2021 Toyota Highlander",
    description:
      "Premium Toyota Highlander with third-row seating and advanced safety features.",
    price: 45000000,
    make: "Toyota",
    model: "Highlander",
    year: 2021,
    mileage: 20000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
    ],
  },
  {
    title: "2022 Toyota Sienna",
    description:
      "Family-friendly Toyota Sienna minivan with entertainment system and sliding doors.",
    price: 38000000,
    make: "Toyota",
    model: "Sienna",
    year: 2022,
    mileage: 12000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "van",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "DVD Player", value: "Yes" },
      { name: "Cruise Control", value: "Yes" },
      { name: "Sliding Doors", value: "Yes" },
    ],
  },

  // Honda
  {
    title: "2023 Honda Civic",
    description:
      "Brand new Honda Civic with sporty design and advanced technology features.",
    price: 28000000,
    make: "Honda",
    model: "Civic",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1590362891991-f776e747a588",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Airbags", value: "Yes" },
      { name: "Apple CarPlay", value: "Yes" },
    ],
  },
  {
    title: "2022 Honda Accord",
    description:
      "Executive Honda Accord with luxurious interior and smooth ride.",
    price: 32000000,
    make: "Honda",
    model: "Accord",
    year: 2022,
    mileage: 10000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
    ],
  },
  {
    title: "2022 Honda CR-V",
    description:
      "Versatile Honda CR-V SUV with spacious cargo area and excellent fuel economy.",
    price: 35000000,
    make: "Honda",
    model: "CR-V",
    year: 2022,
    mileage: 8000,
    condition: "certified_pre_owned",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
    ],
  },
  {
    title: "2021 Honda Pilot",
    description:
      "Full-size Honda Pilot SUV with 8-passenger seating and towing capability.",
    price: 42000000,
    make: "Honda",
    model: "Pilot",
    year: 2021,
    mileage: 25000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
      { name: "Towing Package", value: "Yes" },
    ],
  },
  {
    title: "2023 Honda HR-V",
    description:
      "Compact Honda HR-V crossover with modern styling and efficient performance.",
    price: 30000000,
    make: "Honda",
    model: "HR-V",
    year: 2023,
    mileage: 3000,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578844251758-2f71da64c8fe",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
    ],
  },

  // Mercedes-Benz
  {
    title: "2023 Mercedes-Benz C-Class",
    description:
      "Luxury Mercedes-Benz C-Class with premium materials and advanced technology.",
    price: 45000000,
    make: "Mercedes-Benz",
    model: "C-Class",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1614200179396-2bdb77ebf81b",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Massage Seats", value: "Yes" },
    ],
  },
  {
    title: "2022 Mercedes-Benz E-Class",
    description:
      "Executive Mercedes-Benz E-Class with cutting-edge technology and exceptional comfort.",
    price: 55000000,
    make: "Mercedes-Benz",
    model: "E-Class",
    year: 2022,
    mileage: 8000,
    condition: "certified_pre_owned",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1618843479313-40f0af28f4c7",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Burmester Sound", value: "Yes" },
    ],
  },
  {
    title: "2023 Mercedes-Benz GLC",
    description:
      "Premium Mercedes-Benz GLC SUV with sophisticated design and powerful performance.",
    price: 50000000,
    make: "Mercedes-Benz",
    model: "GLC",
    year: 2023,
    mileage: 2000,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "4MATIC", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
    ],
  },
  {
    title: "2021 Mercedes-Benz GLE",
    description:
      "Luxury Mercedes-Benz GLE SUV with spacious interior and advanced driver assistance.",
    price: 60000000,
    make: "Mercedes-Benz",
    model: "GLE",
    year: 2021,
    mileage: 15000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
    ],
  },

  // BMW
  {
    title: "2023 BMW 3 Series",
    description:
      "Sporty BMW 3 Series with dynamic handling and driver-focused cockpit.",
    price: 42000000,
    make: "BMW",
    model: "3 Series",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1555215695-3004980ad54e",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Harman Kardon Sound", value: "Yes" },
    ],
  },
  {
    title: "2022 BMW 5 Series",
    description:
      "Executive BMW 5 Series with powerful performance and luxurious comfort.",
    price: 50000000,
    make: "BMW",
    model: "5 Series",
    year: 2022,
    mileage: 10000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1555215695-3004980ad54e",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Gesture Control", value: "Yes" },
    ],
  },
  {
    title: "2023 BMW X5",
    description:
      "Premium BMW X5 SUV with impressive off-road capability and luxury features.",
    price: 55000000,
    make: "BMW",
    model: "X5",
    year: 2023,
    mileage: 3000,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "4WD", value: "Yes" },
    ],
  },
  {
    title: "2022 BMW X3",
    description:
      "Compact BMW X3 SUV with sporty handling and premium interior.",
    price: 48000000,
    make: "BMW",
    model: "X3",
    year: 2022,
    mileage: 12000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
    ],
  },

  // Lexus
  {
    title: "2023 Lexus ES 350",
    description:
      "Luxury Lexus ES 350 with refined ride quality and exceptional reliability.",
    price: 48000000,
    make: "Lexus",
    model: "ES 350",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Mark Levinson Sound", value: "Yes" },
    ],
  },
  {
    title: "2022 Lexus RX 350",
    description:
      "Popular Lexus RX 350 SUV with comfortable ride and premium features.",
    price: 52000000,
    make: "Lexus",
    model: "RX 350",
    year: 2022,
    mileage: 8000,
    condition: "certified_pre_owned",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
    ],
  },
  {
    title: "2023 Lexus NX 300",
    description:
      "Compact Lexus NX 300 SUV with sporty design and advanced safety features.",
    price: 46000000,
    make: "Lexus",
    model: "NX 300",
    year: 2023,
    mileage: 2000,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578844251758-2f71da64c8fe",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
    ],
  },

  // Audi
  {
    title: "2023 Audi A4",
    description:
      "Sophisticated Audi A4 with Quattro all-wheel drive and advanced technology.",
    price: 38000000,
    make: "Audi",
    model: "A4",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Quattro", value: "Yes" },
      { name: "Virtual Cockpit", value: "Yes" },
    ],
  },
  {
    title: "2022 Audi Q5",
    description:
      "Versatile Audi Q5 SUV with Quattro all-wheel drive and luxurious interior.",
    price: 42000000,
    make: "Audi",
    model: "Q5",
    year: 2022,
    mileage: 10000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Quattro", value: "Yes" },
      { name: "Parking Sensors", value: "Yes" },
    ],
  },
  {
    title: "2021 Audi Q7",
    description:
      "Full-size Audi Q7 SUV with 7-passenger seating and advanced safety features.",
    price: 50000000,
    make: "Audi",
    model: "Q7",
    year: 2021,
    mileage: 20000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Leather Seats", value: "Yes" },
      { name: "Sunroof", value: "Yes" },
      { name: "Navigation", value: "Yes" },
      { name: "Heated Seats", value: "Yes" },
      { name: "Quattro", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
    ],
  },

  // Nissan
  {
    title: "2023 Nissan Altima",
    description:
      "Stylish Nissan Altima with efficient performance and comfortable interior.",
    price: 25000000,
    make: "Nissan",
    model: "Altima",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
      { name: "Bluetooth", value: "Yes" },
    ],
  },
  {
    title: "2022 Nissan Rogue",
    description:
      "Popular Nissan Rogue SUV with spacious interior and advanced safety features.",
    price: 28000000,
    make: "Nissan",
    model: "Rogue",
    year: 2022,
    mileage: 15000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
      { name: "Bluetooth", value: "Yes" },
    ],
  },
  {
    title: "2021 Nissan Pathfinder",
    description:
      "Rugged Nissan Pathfinder SUV with 7-passenger seating and off-road capability.",
    price: 32000000,
    make: "Nissan",
    model: "Pathfinder",
    year: 2021,
    mileage: 25000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
      { name: "4WD", value: "Yes" },
    ],
  },

  // Hyundai
  {
    title: "2023 Hyundai Elantra",
    description:
      "Affordable Hyundai Elantra with modern design and excellent fuel economy.",
    price: 20000000,
    make: "Hyundai",
    model: "Elantra",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "sedan",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1583121274602-3e2820c69888",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
      { name: "Bluetooth", value: "Yes" },
    ],
  },
  {
    title: "2022 Hyundai Tucson",
    description:
      "Stylish Hyundai Tucson SUV with bold design and advanced technology.",
    price: 26000000,
    make: "Hyundai",
    model: "Tucson",
    year: 2022,
    mileage: 12000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1578844251758-2f71da64c8fe",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
      { name: "Bluetooth", value: "Yes" },
    ],
  },
  {
    title: "2021 Hyundai Santa Fe",
    description:
      "Spacious Hyundai Santa Fe SUV with 7-passenger seating and premium features.",
    price: 30000000,
    make: "Hyundai",
    model: "Santa Fe",
    year: 2021,
    mileage: 20000,
    condition: "used",
    transmission: "automatic",
    fuelType: "petrol",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.0498, 4.8156],
      address: "Port Harcourt, Nigeria",
      city: "Port Harcourt",
      state: "Rivers",
      country: "Nigeria",
      zipCode: "500001",
    },
    features: [
      { name: "Air Conditioning", value: "Yes" },
      { name: "Power Steering", value: "Yes" },
      { name: "ABS", value: "Yes" },
      { name: "Third Row Seats", value: "Yes" },
      { name: "Rear Camera", value: "Yes" },
    ],
  },

  // Tesla
  {
    title: "2023 Tesla Model 3",
    description:
      "Revolutionary Tesla Model 3 with electric drivetrain and autopilot technology.",
    price: 45000000,
    make: "Tesla",
    model: "Model 3",
    year: 2023,
    mileage: 0,
    condition: "new",
    transmission: "automatic",
    fuelType: "electric",
    bodyType: "sedan",
    status: "available",
    isFeatured: true,
    images: [
      {
        url: "https://images.unsplash.com/photo-1560958089-b8a1929cea89",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [3.3792, 6.5244],
      address: "Lagos, Nigeria",
      city: "Lagos",
      state: "Lagos",
      country: "Nigeria",
      zipCode: "100001",
    },
    features: [
      { name: "Autopilot", value: "Yes" },
      { name: "Glass Roof", value: "Yes" },
      { name: "Large Display", value: "Yes" },
      { name: "Electric", value: "Yes" },
      { name: "OTA Updates", value: "Yes" },
    ],
  },
  {
    title: "2022 Tesla Model Y",
    description:
      "Compact Tesla Model Y SUV with electric power and spacious cargo area.",
    price: 50000000,
    make: "Tesla",
    model: "Model Y",
    year: 2022,
    mileage: 5000,
    condition: "certified_pre_owned",
    transmission: "automatic",
    fuelType: "electric",
    bodyType: "suv",
    status: "available",
    isFeatured: false,
    images: [
      {
        url: "https://images.unsplash.com/photo-1568849676085-51415703900f",
        isMain: true,
      },
    ],
    location: {
      type: "Point",
      coordinates: [7.4951, 9.0579],
      address: "Abuja, Nigeria",
      city: "Abuja",
      state: "FCT",
      country: "Nigeria",
      zipCode: "900001",
    },
    features: [
      { name: "Autopilot", value: "Yes" },
      { name: "Glass Roof", value: "Yes" },
      { name: "Large Display", value: "Yes" },
      { name: "Electric", value: "Yes" },
      { name: "Spacious Cargo", value: "Yes" },
    ],
  },
];

const seedCars = async () => {
  try {
    const DB = process.env.DATABASE.replace(
      "<PASSWORD>",
      process.env.DATABASE_PASSWORD
    );
    await mongoose.connect(DB);
    console.log("✅ Connected to MongoDB");

    // Get all dealers (to assign as owners)
    const dealers = await User.find({
      role: { $in: ["dealer", "admin"] },
      isActive: true,
    });

    if (dealers.length === 0) {
      console.error("❌ No dealers found! Please run seed-users.js first.");
      process.exit(1);
    }
    console.log(`✅ Found ${dealers.length} dealers`);

    // Get random users for favorites
    const users = await User.find({ role: "user", isActive: true });
    console.log(`✅ Found ${users.length} users`);

    // Prepare cars with random owners and favorites
    const carsWithData = carsData.map((car, index) => {
      const owner = dealers[index % dealers.length];
      const randomFavorites = users
        .sort(() => 0.5 - Math.random())
        .slice(0, Math.floor(Math.random() * 3) + 1)
        .map((u) => u._id);

      return {
        ...car,
        owner: owner._id,
        isDealer: true,
        viewCount: Math.floor(Math.random() * 100) + 10,
        favorites: randomFavorites,
      };
    });

    // Clear existing cars
    await Car.deleteMany();
    console.log("🗑️ Cleared existing cars");

    // Insert cars in batches
    const batchSize = 10;
    let inserted = 0;
    for (let i = 0; i < carsWithData.length; i += batchSize) {
      const batch = carsWithData.slice(i, i + batchSize);
      const result = await Car.insertMany(batch);
      inserted += result.length;
      console.log(
        `✅ Inserted ${result.length} cars (${inserted}/${carsWithData.length})`
      );
    }

    console.log(`✅ Successfully inserted ${inserted} sample cars!`);
    console.log("\n📊 Summary:");
    console.log(`   - Total cars: ${inserted}`);
    console.log(`   - Dealers: ${dealers.length}`);
    console.log(`   - Users: ${users.length}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
};

seedCars();
