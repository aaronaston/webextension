const patients = [
  {
    id: "p1",
    name: "Amelia Rodriguez",
    dob: "1984-03-14",
    gender: "Female",
    mrn: "A102938",
    primaryPhysician: "Dr. Priya Desai",
    coverage: "Blue Shield PPO",
    language: "English",
    contact: {
      phone: "(415) 555-0199",
      email: "amelia.rodriguez@example.com",
      address: "1240 Jackson St, San Francisco, CA"
    },
    ips: {
      allergies: [
        "Penicillin — rash",
        "Peanuts — anaphylaxis"
      ],
      medications: [
        "Metformin 500 mg PO BID",
        "Lisinopril 10 mg PO daily",
        "Atorvastatin 20 mg PO QHS"
      ],
      problems: [
        "Type 2 diabetes mellitus",
        "Hypertension",
        "Hyperlipidemia"
      ],
      procedures: [
        "Cesarean section (2014)",
        "Screening colonoscopy (2022)"
      ],
      immunizations: [
        "COVID-19 mRNA booster (2024-01-18)",
        "Influenza (2023-10-02)",
        "Tdap (2018-05-09)"
      ],
      medicalDevices: ["Continuous glucose monitor"],
      results: [
        "HbA1c 7.1% (2024-02-15)",
        "BMP within normal limits (2024-02-15)",
        "Lipid panel LDL 92 mg/dL (2023-11-04)"
      ],
      vitalSigns: {
        bloodPressure: "128/78 mmHg",
        heartRate: "74 bpm",
        respiratoryRate: "16 bpm",
        temperature: "36.7°C",
        oxygenSaturation: "98%",
        weight: "82 kg",
        height: "165 cm",
        bmi: "30.1",
        lastUpdated: "2024-04-02"
      },
      planOfCare: [
        "Continue current antihypertensive regimen",
        "Refer to diabetes educator for lifestyle coaching",
        "Repeat HbA1c in 3 months"
      ],
      socialHistory: [
        "Lives with spouse and two children",
        "Works as elementary school teacher",
        "Former smoker, quit 2015"
      ],
      familyHistory: [
        "Mother: type 2 diabetes",
        "Father: hypertension"
      ],
      functionalStatus: ["Independent in ADLs/IADLs"],
      pregnancy: "G2P2, not currently pregnant",
      advanceDirectives: "Full code; health care proxy on file"
    },
    encounters: [
      {
        date: "2024-04-02",
        clinician: "Dr. Priya Desai",
        location: "Endocrinology Clinic",
        soap: {
          subjective:
            "Reports improved energy with diet changes. Notes occasional dizziness when standing quickly.",
          objective:
            "VS stable. Weight down 2 kg. Foot exam normal. CGM data shows average glucose 145 mg/dL.",
          assessment: "Type 2 DM improving control; monitor orthostatic symptoms.",
          plan:
            "Continue metformin. Trial of lower carb dinner meals. Monitor BP sitting/standing at home. Follow up in 6 weeks."
        }
      },
      {
        date: "2024-01-10",
        clinician: "NP Jordan Lee",
        location: "Primary Care",
        soap: {
          subjective:
            "Here for annual exam. Denies chest pain or SOB. Admits to inconsistent statin use.",
          objective:
            "BP 132/82. BMI 30.6. Labs reviewed showing LDL 92.",
          assessment: "Hypertension stable; hyperlipidemia; medication non-adherence.",
          plan:
            "Reinforce statin adherence, set pillbox reminder. Order repeat lipid panel in 3 months."
        }
      }
    ]
  },
  {
    id: "p2",
    name: "Benjamin Carter",
    dob: "1956-07-02",
    gender: "Male",
    mrn: "B564738",
    primaryPhysician: "Dr. Helena Wu",
    coverage: "Medicare Advantage",
    language: "English",
    contact: {
      phone: "(206) 555-0144",
      email: "ben.carter@example.com",
      address: "890 Lakeview Ave, Seattle, WA"
    },
    ips: {
      allergies: ["No known drug allergies"],
      medications: [
        "Apixaban 5 mg PO BID",
        "Metoprolol succinate 50 mg PO daily",
        "Furosemide 20 mg PO daily",
        "Vitamin D3 2000 IU PO daily"
      ],
      problems: [
        "Chronic atrial fibrillation",
        "Heart failure with preserved EF",
        "Stage 2 chronic kidney disease"
      ],
      procedures: [
        "Cardiac catheterization (2018)",
        "Right knee arthroplasty (2016)"
      ],
      immunizations: [
        "Pneumococcal conjugate (2023-06-20)",
        "Influenza (2023-09-28)",
        "COVID-19 bivalent booster (2023-10-12)"
      ],
      medicalDevices: ["BiPAP machine for sleep apnea"],
      results: [
        "Echocardiogram EF 55% (2024-03-11)",
        "BMP creatinine 1.3 mg/dL (2024-03-01)",
        "BNP 180 pg/mL (2024-03-01)"
      ],
      vitalSigns: {
        bloodPressure: "118/70 mmHg",
        heartRate: "68 bpm (irregular)",
        respiratoryRate: "18 bpm",
        temperature: "36.5°C",
        oxygenSaturation: "96%",
        weight: "92 kg",
        height: "178 cm",
        bmi: "29.0",
        lastUpdated: "2024-03-15"
      },
      planOfCare: [
        "Daily weights and symptom diary",
        "Low sodium diet <2g/day",
        "Cardiology follow up every 3 months"
      ],
      socialHistory: [
        "Retired civil engineer",
        "Lives with spouse",
        "Enjoys gardening; limited mobility with exertion"
      ],
      familyHistory: [
        "Father: myocardial infarction age 62",
        "Mother: stroke age 79"
      ],
      functionalStatus: ["Mild limitation climbing stairs"],
      pregnancy: null,
      advanceDirectives: "POLST on file: DNR/DNI, limited interventions"
    },
    encounters: [
      {
        date: "2024-03-15",
        clinician: "Dr. Helena Wu",
        location: "Cardiology Clinic",
        soap: {
          subjective:
            "Reports mild exertional dyspnea climbing stairs, denies orthopnea. Adherent to meds.",
          objective:
            "Weight stable. Lungs clear. Irregularly irregular rhythm, no edema.",
          assessment: "HFpEF stable; AF well controlled on apixaban.",
          plan:
            "Continue current regimen. Encourage daily walking 20 minutes. Labs in 2 months."
        }
      },
      {
        date: "2023-12-02",
        clinician: "PA Maria Chen",
        location: "Urgent Care",
        soap: {
          subjective:
            "Presented with cough and nasal congestion x5 days.",
          objective:
            "Afebrile. Lungs clear. Rapid flu negative.",
          assessment: "Viral upper respiratory infection.",
          plan:
            "Supportive care. Monitor for fever or dyspnea."
        }
      }
    ]
  },
  {
    id: "p3",
    name: "Chloe Nguyen",
    dob: "1992-11-23",
    gender: "Female",
    mrn: "C908172",
    primaryPhysician: "Dr. James Holloway",
    coverage: "Pacific Care HMO",
    language: "Vietnamese, English",
    contact: {
      phone: "(503) 555-0102",
      email: "chloe.nguyen@example.com",
      address: "431 Alder St, Portland, OR"
    },
    ips: {
      allergies: ["Latex — hives"],
      medications: [
        "Levothyroxine 75 mcg PO daily",
        "Sertraline 50 mg PO daily"
      ],
      problems: [
        "Post-thyroidectomy hypothyroidism",
        "Generalized anxiety disorder"
      ],
      procedures: [
        "Total thyroidectomy (2019)",
        "LASIK (2016)"
      ],
      immunizations: [
        "HPV series complete",
        "Influenza (2023-10-03)",
        "COVID-19 booster (2023-11-15)"
      ],
      medicalDevices: [],
      results: [
        "TSH 2.1 mIU/L (2024-02-27)",
        "CMP within normal limits (2024-02-27)"
      ],
      vitalSigns: {
        bloodPressure: "112/68 mmHg",
        heartRate: "70 bpm",
        respiratoryRate: "14 bpm",
        temperature: "36.6°C",
        oxygenSaturation: "99%",
        weight: "61 kg",
        height: "162 cm",
        bmi: "23.2",
        lastUpdated: "2024-02-27"
      },
      planOfCare: [
        "Continue current levothyroxine dose",
        "CBT sessions biweekly",
        "Mindfulness practice 10 min daily"
      ],
      socialHistory: [
        "Works as UX designer",
        "Exercises with yoga 3x/week",
        "Occasional wine"
      ],
      familyHistory: ["Mother: hypothyroidism"],
      functionalStatus: ["No limitations"],
      pregnancy: "G0P0",
      advanceDirectives: "No advance directives on file"
    },
    encounters: [
      {
        date: "2024-02-27",
        clinician: "Dr. James Holloway",
        location: "Primary Care",
        soap: {
          subjective:
            "Feels well, mood stable. Requests refill. Reports cold intolerance improved.",
          objective:
            "VS normal. Thyroidectomy scar well healed. Labs reviewed.",
          assessment: "Hypothyroidism well controlled; anxiety stable.",
          plan:
            "Maintain medications. Schedule preventive visit in 6 months."
        }
      }
    ]
  },
  {
    id: "p4",
    name: "Darius Coleman",
    dob: "1974-05-18",
    gender: "Male",
    mrn: "D726354",
    primaryPhysician: "Dr. Elena Rossi",
    coverage: "United Healthcare PPO",
    language: "English",
    contact: {
      phone: "(303) 555-0178",
      email: "darius.coleman@example.com",
      address: "782 Aspen Way, Denver, CO"
    },
    ips: {
      allergies: ["Shellfish — angioedema"],
      medications: [
        "Albuterol HFA inhaler PRN",
        "Fluticasone-salmeterol 250/50 BID",
        "Montelukast 10 mg nightly"
      ],
      problems: [
        "Moderate persistent asthma",
        "Obstructive sleep apnea on CPAP"
      ],
      procedures: ["Appendectomy (1992)"],
      immunizations: [
        "Influenza (2023-09-25)",
        "COVID-19 booster (2023-10-30)",
        "Pneumococcal PPSV23 (2022-06-14)"
      ],
      medicalDevices: ["CPAP machine"],
      results: [
        "Pulmonary function test FEV1 82% predicted (2023-08-12)",
        "Sleep study AHI 6/hr on CPAP (2022-03-19)"
      ],
      vitalSigns: {
        bloodPressure: "124/80 mmHg",
        heartRate: "76 bpm",
        respiratoryRate: "18 bpm",
        temperature: "36.8°C",
        oxygenSaturation: "97%",
        weight: "96 kg",
        height: "183 cm",
        bmi: "28.7",
        lastUpdated: "2024-03-05"
      },
      planOfCare: [
        "Continue controller inhaler",
        "Annual asthma action plan review",
        "Weight reduction goal 5%"
      ],
      socialHistory: [
        "Works night shifts as paramedic",
        "Former smoker, quit 2001",
        "Recreational cyclist"
      ],
      familyHistory: [
        "Mother: COPD",
        "Father: hypertension"
      ],
      functionalStatus: ["Occasional exertional dyspnea"],
      pregnancy: null,
      advanceDirectives: "Advance directive not provided"
    },
    encounters: [
      {
        date: "2024-03-05",
        clinician: "Dr. Elena Rossi",
        location: "Pulmonology Clinic",
        soap: {
          subjective:
            "Increased nighttime wheeze during pollen season. Using rescue inhaler 3x/week.",
          objective:
            "Lungs clear with mild expiratory wheeze. Peak flow 520 L/min.",
          assessment: "Asthma mildly uncontrolled due to seasonal triggers.",
          plan:
            "Add nightly antihistamine. Reinforce inhaler technique. Follow up in 3 months."
        }
      },
      {
        date: "2023-11-18",
        clinician: "Dr. Elena Rossi",
        location: "Pulmonology Clinic",
        soap: {
          subjective:
            "Routine follow-up. Reports good CPAP adherence.",
          objective:
            "VS stable. CPAP download AHI 4.2/hr.",
          assessment: "Asthma controlled; OSA well managed.",
          plan:
            "Continue current regimen. Annual PFT ordered."
        }
      }
    ]
  },
  {
    id: "p5",
    name: "Elena Garcia",
    dob: "1968-09-30",
    gender: "Female",
    mrn: "E563728",
    primaryPhysician: "Dr. Omar Malik",
    coverage: "Kaiser Permanente",
    language: "Spanish, English",
    contact: {
      phone: "(213) 555-0111",
      email: "elena.garcia@example.com",
      address: "220 Olive St, Los Angeles, CA"
    },
    ips: {
      allergies: ["Sulfa drugs — rash"],
      medications: [
        "Insulin glargine 18 units SC nightly",
        "Empagliflozin 10 mg PO daily",
        "Losartan 50 mg PO daily",
        "Aspirin 81 mg PO daily"
      ],
      problems: [
        "Type 1 diabetes mellitus",
        "Diabetic neuropathy",
        "Stage 1 diabetic retinopathy"
      ],
      procedures: ["Left cataract surgery (2021)"],
      immunizations: [
        "Influenza (2023-09-20)",
        "COVID-19 booster (2023-11-08)",
        "Shingles (2022-05-12)"
      ],
      medicalDevices: ["Insulin pump (backup)", "Continuous glucose monitor"],
      results: [
        "HbA1c 7.6% (2024-03-22)",
        "Urine microalbumin 18 mg/g (2024-03-22)"
      ],
      vitalSigns: {
        bloodPressure: "122/76 mmHg",
        heartRate: "72 bpm",
        respiratoryRate: "16 bpm",
        temperature: "36.6°C",
        oxygenSaturation: "99%",
        weight: "70 kg",
        height: "160 cm",
        bmi: "27.3",
        lastUpdated: "2024-03-22"
      },
      planOfCare: [
        "Adjust basal insulin if fasting glucose >140",
        "Annual dilated eye exam",
        "Foot care checklist monthly"
      ],
      socialHistory: [
        "Owns bakery",
        "Walks 30 minutes daily",
        "Never smoker"
      ],
      familyHistory: [
        "Mother: type 1 diabetes",
        "Brother: hypertension"
      ],
      functionalStatus: ["Mild neuropathic pain controlled"],
      pregnancy: null,
      advanceDirectives: "Durable power of attorney: spouse"
    },
    encounters: [
      {
        date: "2024-03-22",
        clinician: "Dr. Omar Malik",
        location: "Endocrinology Clinic",
        soap: {
          subjective:
            "Reports CGM highs overnight. Experiencing tingling in feet at night.",
          objective:
            "Foot exam reveals decreased monofilament sensation. HbA1c 7.6%.",
          assessment: "Type 1 DM suboptimal control; neuropathy symptoms progressing.",
          plan:
            "Adjust basal insulin by +2 units. Start gabapentin 100 mg HS. Refer to podiatry."
        }
      },
      {
        date: "2023-12-14",
        clinician: "RN Sofia Alvarez",
        location: "Diabetes Education",
        soap: {
          subjective:
            "Discussed carb counting challenges during holidays.",
          objective:
            "Reviewed CGM download showing post-dinner spikes.",
          assessment: "Knowledge gap on carbohydrate ratios.",
          plan:
            "Provided meal planning resources. Schedule follow-up in 1 month."
        }
      }
    ]
  },
  {
    id: "p6",
    name: "Farah Khan",
    dob: "2001-01-08",
    gender: "Female",
    mrn: "F372819",
    primaryPhysician: "Dr. Miguel Hernandez",
    coverage: "Student Health Plan",
    language: "English, Urdu",
    contact: {
      phone: "(312) 555-0132",
      email: "farah.khan@example.com",
      address: "950 University Pl, Evanston, IL"
    },
    ips: {
      allergies: ["Ibuprofen — GI upset"],
      medications: [
        "Combined oral contraceptive pill",
        "Albuterol inhaler PRN"
      ],
      problems: [
        "Mild intermittent asthma",
        "Dysmenorrhea"
      ],
      procedures: [],
      immunizations: [
        "Influenza (2023-09-10)",
        "COVID-19 booster (2023-10-18)",
        "Meningococcal B (2020-08-22)"
      ],
      medicalDevices: [],
      results: ["CBC within normal limits (2023-08-30)"],
      vitalSigns: {
        bloodPressure: "108/64 mmHg",
        heartRate: "72 bpm",
        respiratoryRate: "14 bpm",
        temperature: "36.5°C",
        oxygenSaturation: "99%",
        weight: "58 kg",
        height: "168 cm",
        bmi: "20.5",
        lastUpdated: "2024-01-22"
      },
      planOfCare: [
        "Refill inhaler before travel",
        "Track menstrual symptoms in app"
      ],
      socialHistory: [
        "College senior majoring in biology",
        "Runs track 4x/week",
        "No tobacco or alcohol"
      ],
      familyHistory: ["Mother: asthma", "Maternal grandmother: type 2 diabetes"],
      functionalStatus: ["Fully active"],
      pregnancy: "Not pregnant",
      advanceDirectives: "No advance directives completed"
    },
    encounters: [
      {
        date: "2024-01-22",
        clinician: "Dr. Miguel Hernandez",
        location: "Student Health",
        soap: {
          subjective:
            "Follow-up for asthma. Uses rescue inhaler monthly during winter runs.",
          objective:
            "Lungs clear. Peak flow 480 L/min.",
          assessment: "Mild intermittent asthma well controlled.",
          plan:
            "Continue PRN inhaler. Provide refill and winter trigger education."
        }
      },
      {
        date: "2023-08-30",
        clinician: "Dr. Miguel Hernandez",
        location: "Student Health",
        soap: {
          subjective:
            "Annual physical. Reports severe cramps first 2 days of cycle.",
          objective:
            "VS normal. Abdomen soft, nontender.",
          assessment: "Primary dysmenorrhea.",
          plan:
            "Continue OCP. Trial heat therapy and stretching routine."
        }
      }
    ]
  },
  {
    id: "p7",
    name: "Gabriel Silva",
    dob: "1988-12-05",
    gender: "Male",
    mrn: "G817263",
    primaryPhysician: "Dr. Lauren Patel",
    coverage: "Aetna PPO",
    language: "Portuguese, English",
    contact: {
      phone: "(305) 555-0191",
      email: "gabriel.silva@example.com",
      address: "1440 Coral Way, Miami, FL"
    },
    ips: {
      allergies: ["No known allergies"],
      medications: [
        "Omeprazole 20 mg PO daily",
        "Cetirizine 10 mg PO daily PRN"
      ],
      problems: [
        "Gastroesophageal reflux disease",
        "Seasonal allergic rhinitis"
      ],
      procedures: ["EGD with biopsies (2022)"],
      immunizations: [
        "Influenza (2023-10-05)",
        "COVID-19 booster (2023-11-01)",
        "Tdap (2019-02-11)"
      ],
      medicalDevices: [],
      results: [
        "EGD showed mild esophagitis (2022-06-18)",
        "H. pylori negative"
      ],
      vitalSigns: {
        bloodPressure: "118/74 mmHg",
        heartRate: "68 bpm",
        respiratoryRate: "14 bpm",
        temperature: "36.6°C",
        oxygenSaturation: "98%",
        weight: "80 kg",
        height: "180 cm",
        bmi: "24.7",
        lastUpdated: "2024-02-14"
      },
      planOfCare: [
        "Maintain GERD diet",
        "Avoid late meals",
        "Allergy shots scheduled monthly"
      ],
      socialHistory: [
        "Software engineer",
        "Plays soccer on weekends",
        "Drinks socially"
      ],
      familyHistory: ["Father: GERD", "Mother: seasonal allergies"],
      functionalStatus: ["No limitations"],
      pregnancy: null,
      advanceDirectives: "Not discussed"
    },
    encounters: [
      {
        date: "2024-02-14",
        clinician: "Dr. Lauren Patel",
        location: "Primary Care",
        soap: {
          subjective:
            "Heartburn 1-2x/week when stressed. Allergy symptoms controlled.",
          objective:
            "VS normal. Abdomen non-tender.",
          assessment: "GERD stable with intermittent breakthrough symptoms.",
          plan:
            "Reinforce PPI adherence. Recommend stress management techniques."
        }
      },
      {
        date: "2023-09-07",
        clinician: "Dr. Lauren Patel",
        location: "Primary Care",
        soap: {
          subjective:
            "Requested allergy medication refill prior to ragweed season.",
          objective:
            "Nares congested. Lungs clear.",
          assessment: "Seasonal allergic rhinitis.",
          plan:
            "Renew cetirizine. Start nasal steroid 2 weeks before season."
        }
      }
    ]
  },
  {
    id: "p8",
    name: "Harper Singh",
    dob: "2014-04-22",
    gender: "Female",
    mrn: "H651209",
    primaryPhysician: "Dr. Natalie Brooks",
    coverage: "Family Plan",
    language: "English",
    contact: {
      phone: "(512) 555-0170",
      email: "parent.singh@example.com",
      address: "512 Oak Ridge Dr, Austin, TX"
    },
    ips: {
      allergies: ["Eggs — mild rash"],
      medications: ["Cetirizine 5 mg PO daily during spring"],
      problems: [
        "Mild persistent allergic asthma",
        "Seasonal allergies"
      ],
      procedures: [],
      immunizations: [
        "Childhood series up to date",
        "Influenza (2023-10-01)",
        "COVID-19 pediatric booster (2023-11-03)"
      ],
      medicalDevices: ["Spacer for inhaler"],
      results: ["Spirometry FEV1 88% predicted (2023-07-19)"],
      vitalSigns: {
        bloodPressure: "102/62 mmHg",
        heartRate: "82 bpm",
        respiratoryRate: "20 bpm",
        temperature: "36.7°C",
        oxygenSaturation: "99%",
        weight: "34 kg",
        height: "142 cm",
        bmi: "16.9",
        lastUpdated: "2024-02-02"
      },
      planOfCare: [
        "Asthma action plan review each visit",
        "Peak flow monitoring during allergy season"
      ],
      socialHistory: [
        "Lives with parents and younger brother",
        "5th grade student",
        "Plays violin"
      ],
      familyHistory: ["Father: seasonal allergies", "Maternal aunt: asthma"],
      functionalStatus: ["Active, participates in sports"],
      pregnancy: null,
      advanceDirectives: "Pediatric consent on file with parents"
    },
    encounters: [
      {
        date: "2024-02-02",
        clinician: "Dr. Natalie Brooks",
        location: "Pediatrics",
        soap: {
          subjective:
            "Mother reports nighttime cough twice weekly. Using controller inhaler daily.",
          objective:
            "Lungs clear, peak flow 290 L/min (personal best 310).",
          assessment: "Asthma slightly uncontrolled during cedar pollen season.",
          plan:
            "Add montelukast nightly for 3 months. Provide updated school action plan."
        }
      },
      {
        date: "2023-07-19",
        clinician: "Dr. Natalie Brooks",
        location: "Pediatrics",
        soap: {
          subjective:
            "Well-child visit. Occasional wheeze with outdoor play in spring.",
          objective:
            "Growth tracking along 60th percentile. Spirometry FEV1 88%.",
          assessment: "Asthma well controlled overall.",
          plan:
            "Continue inhaled corticosteroid. Emphasize trigger avoidance."
        }
      }
    ]
  },
  {
    id: "p9",
    name: "Isabella Marino",
    dob: "1945-02-11",
    gender: "Female",
    mrn: "I210987",
    primaryPhysician: "Dr. Aaron Goldberg",
    coverage: "Medicare",
    language: "Italian, English",
    contact: {
      phone: "(917) 555-0188",
      email: "isabella.marino@example.com",
      address: "45 West 81st St, New York, NY"
    },
    ips: {
      allergies: ["Codeine — nausea"],
      medications: [
        "Warfarin 3 mg PO daily",
        "Levothyroxine 88 mcg PO daily",
        "Calcium + Vitamin D supplement"
      ],
      problems: [
        "Mechanical mitral valve replacement",
        "Atrial fibrillation",
        "Osteoporosis"
      ],
      procedures: [
        "Mitral valve replacement (2011)",
        "Right hip replacement (2019)"
      ],
      immunizations: [
        "Influenza high-dose (2023-10-12)",
        "COVID-19 booster (2023-10-29)",
        "Pneumococcal PPSV23 (2021-05-04)"
      ],
      medicalDevices: ["Mitral valve prosthesis"],
      results: [
        "INR 2.6 (2024-03-29)",
        "DEXA T-score -2.6 lumbar spine (2023-05-18)"
      ],
      vitalSigns: {
        bloodPressure: "126/72 mmHg",
        heartRate: "72 bpm",
        respiratoryRate: "18 bpm",
        temperature: "36.6°C",
        oxygenSaturation: "97%",
        weight: "62 kg",
        height: "158 cm",
        bmi: "24.8",
        lastUpdated: "2024-03-29"
      },
      planOfCare: [
        "Maintain INR between 2.5-3.5",
        "Fall prevention exercises",
        "Calcium/vitamin D supplementation"
      ],
      socialHistory: [
        "Lives independently",
        "Enjoys cooking and choir",
        "Widowed"
      ],
      familyHistory: [
        "Mother: osteoporosis",
        "Sister: breast cancer"
      ],
      functionalStatus: ["Uses cane for long distances"],
      pregnancy: null,
      advanceDirectives: "Living will and DNR on file"
    },
    encounters: [
      {
        date: "2024-03-29",
        clinician: "Dr. Aaron Goldberg",
        location: "Anticoagulation Clinic",
        soap: {
          subjective:
            "No bleeding or bruising. Taking warfarin consistently.",
          objective:
            "INR 2.6. VS stable.",
          assessment: "Therapeutic anticoagulation; stable status.",
          plan:
            "Continue current dose. Recheck INR in 4 weeks."
        }
      },
      {
        date: "2023-12-05",
        clinician: "Dr. Aaron Goldberg",
        location: "Primary Care",
        soap: {
          subjective:
            "Follow-up for osteoporosis. Notes occasional hip stiffness mornings.",
          objective:
            "No tenderness. Gait steady with cane.",
          assessment: "Osteoporosis stable on therapy.",
          plan:
            "Continue bisphosphonate holiday. Encourage balance exercises."
        }
      }
    ]
  },
  {
    id: "p10",
    name: "Jamal Thompson",
    dob: "1979-06-27",
    gender: "Male",
    mrn: "J564120",
    primaryPhysician: "Dr. Sophia Kim",
    coverage: "Community Health Plan",
    language: "English",
    contact: {
      phone: "(404) 555-0166",
      email: "jamal.thompson@example.com",
      address: "985 Pinecrest Ave, Atlanta, GA"
    },
    ips: {
      allergies: ["ACE inhibitors — cough"],
      medications: [
        "Hydrochlorothiazide 25 mg PO daily",
        "Amlodipine 5 mg PO daily",
        "Metformin 500 mg PO BID"
      ],
      problems: [
        "Hypertension",
        "Prediabetes",
        "Obesity class I"
      ],
      procedures: ["Left ankle ORIF (2008)"],
      immunizations: [
        "Influenza (2023-10-09)",
        "COVID-19 booster (2023-11-10)",
        "Tdap (2015-04-21)"
      ],
      medicalDevices: [],
      results: [
        "HbA1c 5.9% (2024-01-18)",
        "BMP normal (2024-01-18)",
        "Lipid panel LDL 110 mg/dL (2024-01-18)"
      ],
      vitalSigns: {
        bloodPressure: "134/84 mmHg",
        heartRate: "80 bpm",
        respiratoryRate: "16 bpm",
        temperature: "36.7°C",
        oxygenSaturation: "98%",
        weight: "104 kg",
        height: "188 cm",
        bmi: "29.4",
        lastUpdated: "2024-01-18"
      },
      planOfCare: [
        "Enroll in hypertension coaching program",
        "Target 7% weight loss in 6 months",
        "Repeat labs in 6 months"
      ],
      socialHistory: [
        "Works as elementary school principal",
        "Walks dog nightly",
        "Occasional cigar (monthly)"
      ],
      familyHistory: [
        "Father: hypertension",
        "Mother: type 2 diabetes"
      ],
      functionalStatus: ["No limitations"],
      pregnancy: null,
      advanceDirectives: "Verbal discussion completed; paperwork pending"
    },
    encounters: [
      {
        date: "2024-01-18",
        clinician: "Dr. Sophia Kim",
        location: "Primary Care",
        soap: {
          subjective:
            "Follow-up for hypertension. Reports home BP avg 138/86. Working on diet.",
          objective:
            "Clinic BP 134/84. Weight 104 kg. Labs reviewed.",
          assessment: "Hypertension borderline control; prediabetes stable.",
          plan:
            "Increase amlodipine to 10 mg daily. Refer to nutritionist."
        }
      },
      {
        date: "2023-09-12",
        clinician: "Health Coach Maya Patel",
        location: "Wellness Center",
        soap: {
          subjective:
            "Discussed activity barriers due to workload.",
          objective:
            "Reviewed step counts averaging 5k/day.",
          assessment: "Needs structured plan for exercise.",
          plan:
            "Set goal of 7k steps/day and weekend hikes twice monthly."
        }
      }
    ]
  }
];

const patientListEl = document.getElementById("patient-list");
const patientOverviewEl = document.getElementById("patient-overview");
const ipsSectionsEl = document.getElementById("ips-sections");
const encounterNotesEl = document.getElementById("encounter-notes");
const notesContainerEl = document.getElementById("notes-container");
const medicationModalEl = document.getElementById("medication-modal");
const medicationFormEl = document.getElementById("medication-form");
const medicationInputEl = document.getElementById("medication-input");
const medicationCancelEl = document.getElementById("medication-cancel");
const medicationCloseEl = document.getElementById("medication-close");

let activePatientId = null;
let lastFocusedElement = null;

function calculateAge(dob) {
  const birthDate = new Date(dob);
  const diff = Date.now() - birthDate.getTime();
  const ageDate = new Date(diff);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
}

function formatDate(dateString) {
  const options = { year: "numeric", month: "short", day: "numeric" };
  return new Date(dateString + "T00:00:00").toLocaleDateString(undefined, options);
}

function renderPatientList() {
  patients.forEach((patient, index) => {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.className = "patient-card";
    button.innerHTML = `
      <div class="name">${patient.name}</div>
      <div class="meta">MRN ${patient.mrn}</div>
      <div class="meta">${formatDate(patient.dob)} • ${patient.gender}</div>
    `;
    button.addEventListener("click", () => selectPatient(patient.id));
    button.setAttribute("data-patient-id", patient.id);
    button.setAttribute("aria-pressed", "false");
    button.tabIndex = 0;
    li.appendChild(button);
    patientListEl.appendChild(li);

    if (index === 0) {
      selectPatient(patient.id);
    }
  });
}

function selectPatient(patientId) {
  activePatientId = patientId;
  document
    .querySelectorAll(".patient-card")
    .forEach((card) => {
      const isActive = card.getAttribute("data-patient-id") === patientId;
      card.classList.toggle("active", isActive);
      card.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

  const patient = patients.find((p) => p.id === patientId);
  if (!patient) return;

  renderOverview(patient);
  renderIpsSections(patient.ips);
  renderEncounters(patient.encounters);
}

function renderOverview(patient) {
  const age = calculateAge(patient.dob);
  patientOverviewEl.innerHTML = `
    <h2>${patient.name}</h2>
    <div class="patient-overview-grid">
      <div class="overview-item">
        <h3>Identifiers</h3>
        <p>MRN: ${patient.mrn}</p>
        <p>DOB: ${formatDate(patient.dob)} (${age} yrs)</p>
        <p>Gender: ${patient.gender}</p>
      </div>
      <div class="overview-item">
        <h3>Care Team</h3>
        <p>Primary: ${patient.primaryPhysician}</p>
        <p>Coverage: ${patient.coverage}</p>
        <p>Preferred language: ${patient.language}</p>
      </div>
      <div class="overview-item">
        <h3>Contact</h3>
        <p>${patient.contact.phone}</p>
        <p>${patient.contact.email}</p>
        <p>${patient.contact.address}</p>
      </div>
    </div>
  `;
}

function renderIpsSections(ips) {
  const sections = [
    { key: "allergies", title: "Allergies" },
    { key: "medications", title: "Medications" },
    { key: "problems", title: "Problem List" },
    { key: "procedures", title: "Procedures" },
    { key: "immunizations", title: "Immunizations" },
    { key: "medicalDevices", title: "Medical Devices" },
    { key: "results", title: "Diagnostic Results" },
    { key: "vitalSigns", title: "Vital Signs" },
    { key: "planOfCare", title: "Plan of Care" },
    { key: "socialHistory", title: "Social History" },
    { key: "familyHistory", title: "Family History" },
    { key: "functionalStatus", title: "Functional Status" },
    { key: "pregnancy", title: "Pregnancy" },
    { key: "advanceDirectives", title: "Advance Directives" }
  ];

  ipsSectionsEl.innerHTML = "";

  sections.forEach(({ key, title }) => {
    const sectionData = ips[key];
    if (sectionData == null || (Array.isArray(sectionData) && sectionData.length === 0)) {
      return;
    }

    const section = document.createElement("article");
    section.className = "ips-section";

    const header = document.createElement("div");
    header.className = "section-header";

    const heading = document.createElement("h3");
    heading.textContent = title;
    header.appendChild(heading);

    if (key === "medications") {
      const addButton = document.createElement("button");
      addButton.type = "button";
      addButton.className = "icon-button icon-button--accent";
      addButton.innerHTML = '<span aria-hidden="true">+</span>';
      addButton.setAttribute("aria-label", "Add medication");
      addButton.addEventListener("click", openMedicationDialog);
      header.appendChild(addButton);
    }

    section.appendChild(header);

    if (key === "vitalSigns" && typeof sectionData === "object") {
      section.appendChild(renderVitalSigns(sectionData));
    } else if (Array.isArray(sectionData)) {
      const list = document.createElement("ul");
      sectionData.forEach((item) => {
        const li = document.createElement("li");
        li.textContent = item;
        list.appendChild(li);
      });
      section.appendChild(list);
    } else if (typeof sectionData === "string") {
      const p = document.createElement("p");
      p.textContent = sectionData;
      section.appendChild(p);
    }

    ipsSectionsEl.appendChild(section);
  });

  ipsSectionsEl.classList.toggle("hidden", ipsSectionsEl.children.length === 0);
}

function renderVitalSigns(vitalSigns) {
  const container = document.createElement("div");
  container.className = "overview-item";
  const entries = [
    ["Blood pressure", vitalSigns.bloodPressure],
    ["Heart rate", vitalSigns.heartRate],
    ["Respiratory rate", vitalSigns.respiratoryRate],
    ["Temperature", vitalSigns.temperature],
    ["O₂ saturation", vitalSigns.oxygenSaturation],
    ["Weight", vitalSigns.weight],
    ["Height", vitalSigns.height],
    ["BMI", vitalSigns.bmi],
    ["Updated", formatDate(vitalSigns.lastUpdated)]
  ];

  entries.forEach(([label, value]) => {
    if (!value) return;
    const row = document.createElement("p");
    row.innerHTML = `<strong>${label}:</strong> ${value}`;
    container.appendChild(row);
  });

  return container;
}

function renderEncounters(encounters) {
  notesContainerEl.innerHTML = "";

  const sorted = [...encounters].sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

  sorted.forEach((encounter) => {
    const card = document.createElement("article");
    card.className = "note-card";
    card.innerHTML = `
      <h3>${encounter.location}</h3>
      <div class="meta">${formatDate(encounter.date)} • ${encounter.clinician}</div>
    `;

    [
      ["S", encounter.soap.subjective],
      ["O", encounter.soap.objective],
      ["A", encounter.soap.assessment],
      ["P", encounter.soap.plan]
    ].forEach(([label, text]) => {
      if (!text) return;
      const p = document.createElement("p");
      p.className = "soap-section";
      p.innerHTML = `<strong>${label}:</strong> ${text}`;
      card.appendChild(p);
    });

    notesContainerEl.appendChild(card);
  });

  encounterNotesEl.classList.toggle("hidden", sorted.length === 0);
}

function openMedicationDialog(event) {
  if (event) {
    event.preventDefault();
  }
  if (!activePatientId) {
    return;
  }

  lastFocusedElement = document.activeElement;
  medicationInputEl.value = "";
  medicationModalEl.classList.remove("hidden");
  requestAnimationFrame(() => medicationInputEl.focus());
}

function closeMedicationDialog() {
  medicationModalEl.classList.add("hidden");
  if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
    lastFocusedElement.focus();
  }
}

medicationFormEl.addEventListener("submit", (event) => {
  event.preventDefault();
  const value = medicationInputEl.value.trim();
  if (!value) {
    medicationInputEl.focus();
    return;
  }

  const patient = patients.find((p) => p.id === activePatientId);
  if (!patient) {
    closeMedicationDialog();
    return;
  }

  if (!Array.isArray(patient.ips.medications)) {
    patient.ips.medications = [];
  }
  patient.ips.medications = [...patient.ips.medications, value];

  closeMedicationDialog();
  renderOverview(patient);
  renderIpsSections(patient.ips);
  renderEncounters(patient.encounters);
});

medicationCancelEl.addEventListener("click", (event) => {
  event.preventDefault();
  closeMedicationDialog();
});

medicationCloseEl.addEventListener("click", (event) => {
  event.preventDefault();
  closeMedicationDialog();
});

medicationModalEl.addEventListener("click", (event) => {
  if (event.target === medicationModalEl) {
    closeMedicationDialog();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !medicationModalEl.classList.contains("hidden")) {
    event.preventDefault();
    closeMedicationDialog();
  }
});

renderPatientList();
