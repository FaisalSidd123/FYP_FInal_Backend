// Backend/FYP_FInal_Backend/seedMoreCases.js
// ─────────────────────────────────────────────────────────────────────
// Drop into Backend/FYP_FInal_Backend/ and run:
//     node seedMoreCases.js
//
// Inserts 10 fully-populated practice cases matching ALL 41 columns
// from your random_cases table (verified against routes/randomCases.js
// POST /create endpoint). Works for local PostgreSQL and Supabase.
// ─────────────────────────────────────────────────────────────────────
require("dotenv").config();
const pool = require("./db");

/* ═══════════════════════════════════════════════════════════════════
   10 PRACTICE CASES · 4 High · 4 Medium · 2 Low
   ═══════════════════════════════════════════════════════════════════ */
const cases = [
    /* ── 1 ─ HIGH ─ Acute STEMI ──────────────────────────────────── */
    {
        case_number: "CASE-004",
        title: "Acute Myocardial Infarction (STEMI)",
        specialty: "Cardiology",
        patient_info: "55-year-old male, businessman",
        severity: "High",
        confidence: 95,
        difficulty_level: "Advanced",
        estimated_time_minutes: 20,

        chief_complaint: "Severe crushing chest pain radiating to left arm for 2 hours",
        history_of_present_illness:
            "Mr. Tariq is a 55-year-old businessman presenting with 2-hour history of severe crushing chest pain radiating to his left arm and jaw, 9/10 intensity, with profuse sweating, nausea, and a sense of impending doom. Antacids gave no relief. No prior similar episodes.",
        symptoms: ["Chest pain radiating to left arm", "Diaphoresis", "Dyspnea", "Nausea", "Sense of impending doom"],
        past_medical_history: [
            { condition: "Hypertension", duration: "7 years", controlled: "false" },
            { condition: "Hyperlipidemia", duration: "5 years", controlled: "false" },
            { condition: "Type 2 Diabetes", duration: "3 years", controlled: "suboptimal" },
        ],
        medications: ["Amlodipine 10 mg OD", "Atorvastatin 20 mg OD", "Metformin 1 g BD"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "1 pack/day × 30 years", alcohol: "Occasional", occupation: "Businessman", exercise: "Sedentary" },
        family_history: "Father died of MI at age 58. Mother — type 2 diabetes.",

        vital_signs: {
            temperature: "37.1 °C",
            heart_rate: "110 bpm",
            blood_pressure: "158/96 mmHg",
            respiratory_rate: "20 breaths/min",
            oxygen_saturation: "96% on room air",
        },
        general_examination: "Alert and oriented but in severe distress. Diaphoretic and pale. Clutching chest. No cyanosis.",
        systemic_examination: {
            cardiovascular: "S1, S2 present, S4 gallop. No murmurs. JVP mildly elevated. Peripheral pulses present.",
            respiratory: "Clear bilaterally. No crackles.",
            abdominal: "Soft, non-tender. No organomegaly.",
            neurological: "GCS 15/15. Intact.",
        },

        laboratory_results: [
            { test: "ECG", results: { finding: "ST elevation in II, III, aVF (>2mm). Reciprocal depression in I, aVL." }, interpretation: "Inferior STEMI — RCA territory" },
            { test: "Troponin I (HS)", results: { troponin: "4.2 ng/mL (ref <0.04)" }, interpretation: "Markedly elevated — myocardial necrosis" },
            { test: "Complete Blood Count", results: { WBC: "12,000/µL", Platelets: "220,000/µL", Hemoglobin: "14.5 g/dL" }, interpretation: "Mild stress leukocytosis" },
            { test: "Random Blood Glucose", results: { glucose: "215 mg/dL" }, interpretation: "Stress hyperglycemia" },
        ],
        imaging_findings: [
            { test: "Chest X-Ray", findings: "Mild cardiomegaly. No pulmonary edema.", interpretation: "Hypertensive heart disease" },
        ],
        other_investigations: [
            { test: "Lipid Profile", results: { LDL: "164 mg/dL", HDL: "32 mg/dL" }, interpretation: "Atherogenic profile" },
        ],

        differential_diagnosis: [
            { diagnosis: "Inferior STEMI", likelihood: "Very High", reasoning: "Classic anginal pain + ST elevation in inferior leads + elevated troponin" },
            { diagnosis: "Aortic dissection", likelihood: "Low", reasoning: "No tearing back pain or pulse deficit" },
            { diagnosis: "Pulmonary embolism", likelihood: "Low", reasoning: "No pleuritic pain or hypoxia" },
            { diagnosis: "Pericarditis", likelihood: "Low", reasoning: "Localized ST elevation pattern not diffuse" },
        ],
        final_diagnosis: "Acute Inferior ST-Elevation Myocardial Infarction (STEMI)",
        diagnosis_reasoning: "Classic ischemic chest pain with diagnostic ST elevation in II, III, aVF (>2mm), reciprocal changes in I/aVL, and significantly elevated troponin. Risk factors (HTN, T2DM, smoking, dyslipidemia) reinforce the diagnosis.",

        management_plan: {
            immediate: ["MONA-B: Morphine 2-4 mg IV, O₂ if SpO₂<94%, Nitrate SL, Aspirin 300 mg + Clopidogrel 600 mg loading", "Activate cath-lab for primary PCI within 90 minutes", "Heparin or Enoxaparin", "Continuous cardiac monitoring"],
            short_term: ["Beta-blocker (Metoprolol) once stable", "High-intensity statin (Atorvastatin 80 mg)", "ACE inhibitor within 24 hours"],
            long_term: ["Cardiac rehabilitation", "Lifestyle modification — smoking cessation, diet, exercise", "Aggressive secondary prevention", "Follow-up echocardiogram"],
        },
        recommendations: [
            "Immediate dual antiplatelet loading (Aspirin + Clopidogrel/Ticagrelor)",
            "Primary PCI within 90 minutes of first medical contact",
            "Initiate guideline-directed medical therapy",
            "Cardiac rehabilitation referral on discharge",
        ],
        tests: ["Serial ECGs", "Serial Troponin", "Echocardiography", "Coronary Angiography"],
        prognosis: "Good if reperfusion achieved promptly. 30-day mortality 5-7% with timely PCI. Long-term outcome depends on LV function and secondary prevention.",

        learning_objectives: [
            "Recognize ECG criteria for inferior STEMI",
            "Identify time-critical reperfusion windows",
            "Understand the role of dual antiplatelet therapy",
            "Apply secondary prevention strategies post-MI",
        ],
        key_teaching_points: [
            "Time is muscle — door-to-balloon time <90 minutes is the gold standard",
            "ST elevation in II/III/aVF = inferior wall = usually right coronary artery",
            "Right ventricular involvement (V4R) means avoiding nitrates and preload reduction",
            "Troponin elevation defines myocardial injury; rise/fall pattern confirms acute MI",
        ],
        clinical_pearls: [
            "Always check V4R in inferior STEMI to detect RV infarction",
            "Hypotension after nitrate in inferior MI suggests RV involvement",
            "Reciprocal changes increase diagnostic specificity",
        ],
        common_pitfalls: [
            "Missing inferior MI by not looking at lead III",
            "Giving nitrates in RV infarction → catastrophic hypotension",
            "Delaying PCI activation while waiting for troponin",
        ],
        references: [
            "2023 ESC Guidelines for the Management of Acute Coronary Syndromes",
            "AHA/ACC Guideline for the Management of STEMI (2013, updated 2022)",
        ],

        questions: [
            {
                question: "What is the most immediate definitive treatment for this patient?",
                options: ["Thrombolytic therapy", "Primary PCI", "CABG", "Conservative medical management"],
                correct: 1,
                explanation: "Primary PCI within 90 minutes of first medical contact is the gold standard for STEMI when a cath-lab is available.",
            },
            {
                question: "Which ECG finding confirms an inferior wall MI?",
                options: ["ST elevation in V1-V4", "ST elevation in I and aVL", "ST elevation in II, III, aVF", "Diffuse ST depression"],
                correct: 2,
                explanation: "ST elevation in leads II, III, and aVF is diagnostic of inferior wall STEMI — typically from RCA occlusion.",
            },
        ],
        theory_questions: [
            {
                question: "Outline the immediate (first hour) management of a patient presenting with STEMI.",
                model_answer: "Immediate management includes: (1) MONA-B — Morphine for pain, Oxygen if SpO₂<94%, Nitrates SL, Aspirin 300mg + second antiplatelet (Clopidogrel 600mg or Ticagrelor 180mg) loading, Beta-blocker if no contraindication; (2) Anticoagulation with heparin or enoxaparin; (3) 12-lead ECG and continuous monitoring; (4) Immediate activation of cath-lab for primary PCI within 90 minutes; (5) If PCI unavailable within 120 minutes, fibrinolysis within 30 minutes of contact.",
                keywords: ["dual antiplatelet", "PCI", "90 minutes", "aspirin", "anticoagulation", "ECG"],
            },
            {
                question: "Explain the significance of reciprocal ECG changes in STEMI.",
                model_answer: "Reciprocal changes (ST depression in leads opposite to the area of injury) are seen in approximately 70% of STEMIs. They increase specificity of the diagnosis, help confirm true ischemia rather than early repolarization or pericarditis, and may indicate larger infarct size or multivessel disease. In inferior STEMI, reciprocal changes appear in leads I and aVL.",
                keywords: ["reciprocal changes", "ST depression", "specificity", "inferior", "I aVL"],
            },
        ],

        description: "55-year-old businessman with classic STEMI presentation — chest pain, ECG changes, elevated troponin.",
        icon: "Heart",
        color: "bg-red-500",
        tags: ["Cardiology", "Emergency", "ACS", "STEMI"],
    },

    /* ── 2 ─ HIGH ─ DKA ─────────────────────────────────────────── */
    {
        case_number: "CASE-005",
        title: "Diabetic Ketoacidosis (DKA)",
        specialty: "Endocrinology",
        patient_info: "19-year-old female, university student",
        severity: "High",
        confidence: 95,
        difficulty_level: "Intermediate",
        estimated_time_minutes: 18,

        chief_complaint: "Nausea, vomiting, abdominal pain for 2 days with altered consciousness",
        history_of_present_illness:
            "Aisha, a 19-year-old student, brought by her roommate with 2-day history of nausea, vomiting, and diffuse abdominal pain. 3-week history of polyuria, polydipsia, weight loss, and progressive lethargy. No prior medical history. On examination has deep rapid breathing with fruity breath odor.",
        symptoms: ["Polyuria", "Polydipsia", "Kussmaul breathing", "Altered mental status", "Abdominal pain", "Fruity breath"],
        past_medical_history: [],
        medications: ["None"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Non-smoker", alcohol: "Occasional social", occupation: "University student", exercise: "Sedentary lately" },
        family_history: "Paternal uncle with Type 1 diabetes.",

        vital_signs: {
            temperature: "37.8 °C",
            heart_rate: "124 bpm",
            blood_pressure: "104/68 mmHg",
            respiratory_rate: "28 breaths/min, deep",
            oxygen_saturation: "98% on room air",
        },
        general_examination: "Drowsy but rousable, GCS 13/15. Dry mucous membranes, reduced skin turgor. Kussmaul respiration. Fruity acetone breath. Sunken eyes.",
        systemic_examination: {
            neurological: "GCS 13/15 (E4 V4 M5). Confused, disoriented. No focal deficit.",
            respiratory: "Deep regular Kussmaul breathing — compensatory for metabolic acidosis.",
            cardiovascular: "Tachycardia, regular. Volume depleted.",
            abdominal: "Diffuse tenderness, no guarding. Pseudo-acute abdomen of DKA.",
        },

        laboratory_results: [
            { test: "Arterial Blood Gas", results: { pH: "7.08", HCO3: "6 mEq/L", PaCO2: "18 mmHg", base_excess: "-22" }, interpretation: "Severe metabolic acidosis with respiratory compensation" },
            { test: "Serum Glucose", results: { glucose: "498 mg/dL (27.6 mmol/L)" }, interpretation: "Severe hyperglycemia" },
            { test: "Urine Dipstick", results: { glucose: "4+", ketones: "4+", protein: "trace" }, interpretation: "Glycosuria + ketonuria — DKA hallmark" },
            { test: "Serum Electrolytes", results: { Sodium: "132 mEq/L", Potassium: "5.8 mEq/L initial", Chloride: "98 mEq/L" }, interpretation: "Dilutional hyponatremia. Pseudohyperkalemia — total body K depleted." },
            { test: "Serum Ketones", results: { "beta-hydroxybutyrate": "6.4 mmol/L (ref <0.5)" }, interpretation: "Severe ketonemia" },
            { test: "HbA1c", results: { HbA1c: "13.2%" }, interpretation: "Severely elevated — undiagnosed diabetes for months" },
        ],
        imaging_findings: [
            { test: "Chest X-Ray", findings: "Clear lung fields. No focal consolidation.", interpretation: "No infectious trigger on imaging" },
        ],
        other_investigations: [
            { test: "Anion Gap", results: { anion_gap: "28 mEq/L (ref 8-12)" }, interpretation: "High anion gap metabolic acidosis" },
        ],

        differential_diagnosis: [
            { diagnosis: "Diabetic Ketoacidosis (new-onset T1DM)", likelihood: "Very High", reasoning: "Triad of hyperglycemia, ketosis, acidosis with HbA1c 13.2%" },
            { diagnosis: "Hyperosmolar Hyperglycemic State", likelihood: "Low", reasoning: "Severe ketosis present, not typical for HHS" },
            { diagnosis: "Alcoholic ketoacidosis", likelihood: "Very Low", reasoning: "No alcohol history; glucose far higher than typical AKA" },
            { diagnosis: "Salicylate toxicity", likelihood: "Very Low", reasoning: "No exposure history" },
        ],
        final_diagnosis: "Diabetic Ketoacidosis — new-onset Type 1 Diabetes Mellitus",
        diagnosis_reasoning: "Diagnostic triad met: hyperglycemia (>250 mg/dL), ketosis (β-OHB >3 mmol/L, urine ketones 4+), and high-anion-gap metabolic acidosis (pH <7.30, HCO3 <18). HbA1c of 13.2% indicates chronic uncontrolled hyperglycemia, suggesting new-onset T1DM unmasked by this episode.",

        management_plan: {
            immediate: ["IV 0.9% NaCl 1-1.5 L over first hour", "Continuous insulin infusion 0.1 U/kg/hr AFTER K replacement initiated", "K replacement if serum K <5.3", "Hourly capillary glucose"],
            short_term: ["Transition to subcutaneous insulin once anion gap closes and patient eating", "Identify precipitant", "Start basal-bolus regimen"],
            long_term: ["Diabetes education, glucose monitoring training", "Endocrinology follow-up", "Sick-day management plan"],
        },
        recommendations: [
            "Fluid resuscitation first, insulin second",
            "Monitor potassium closely — replace BEFORE insulin if K<3.3",
            "Avoid bicarbonate unless pH <6.9",
            "Identify precipitant (infection, missed insulin, new diagnosis)",
        ],
        tests: ["Serial glucose hourly", "Serial electrolytes 2-4 hourly", "Serial ABG", "C-peptide (for T1 vs T2 distinction)"],
        prognosis: "Excellent with timely management. Mortality <1% in young adults. Lifelong insulin therapy required for T1DM.",

        learning_objectives: [
            "Recognize the diagnostic triad of DKA",
            "Apply correct fluid and insulin protocols",
            "Understand potassium dynamics during DKA treatment",
            "Identify common DKA precipitants",
        ],
        key_teaching_points: [
            "DKA triad: hyperglycemia + ketosis + anion-gap metabolic acidosis",
            "Insulin shifts K intracellularly — anticipate hypokalemia",
            "Fluids first, insulin second, then potassium replacement",
            "Cerebral edema is rare but devastating — avoid overly rapid sodium correction",
        ],
        clinical_pearls: [
            "Anion gap closure is the marker of biochemical recovery — not just glucose",
            "Continue insulin infusion until anion gap normalizes, even if glucose is normal (add dextrose to fluids)",
            "Fruity acetone breath has high specificity in the right clinical context",
        ],
        common_pitfalls: [
            "Stopping insulin when glucose normalizes — leads to relapse",
            "Aggressive bicarbonate therapy — increases cerebral edema risk",
            "Not checking potassium before starting insulin",
        ],
        references: [
            "ADA Standards of Care in Diabetes (2024)",
            "JBDS-IP Management of DKA in Adults Guideline",
        ],

        questions: [
            {
                question: "What is the most urgent initial step in management?",
                options: ["IV insulin bolus", "IV normal saline", "IV sodium bicarbonate", "Oral rehydration"],
                correct: 1,
                explanation: "Fluid resuscitation with 0.9% saline is the first priority. Insulin follows once IV access and potassium are addressed.",
            },
            {
                question: "Why must potassium be monitored before starting insulin?",
                options: ["Insulin raises potassium", "Insulin drives K into cells, causing hypokalemia", "Potassium has no role in DKA", "Insulin causes renal K loss"],
                correct: 1,
                explanation: "Insulin shifts potassium intracellularly. Despite high initial readings, total body K is depleted; rapid drops can cause fatal arrhythmias.",
            },
        ],
        theory_questions: [
            {
                question: "Describe the pathophysiology of Diabetic Ketoacidosis.",
                model_answer: "DKA arises from absolute insulin deficiency combined with elevated counter-regulatory hormones (glucagon, catecholamines, cortisol, GH). This drives: (1) Hepatic gluconeogenesis and reduced peripheral glucose uptake → hyperglycemia; (2) Lipolysis releasing free fatty acids that the liver converts to ketone bodies (β-hydroxybutyrate, acetoacetate) → ketosis and metabolic acidosis; (3) Osmotic diuresis from glycosuria → dehydration and electrolyte loss. The triad is hyperglycemia, ketonemia, and high-anion-gap metabolic acidosis.",
                keywords: ["insulin deficiency", "counter-regulatory hormones", "lipolysis", "ketone bodies", "osmotic diuresis", "anion gap"],
            },
        ],

        description: "Young patient with new-onset T1DM presenting in DKA — classic triad with severe acidosis.",
        icon: "Activity",
        color: "bg-orange-500",
        tags: ["Endocrinology", "Emergency", "Diabetes", "DKA"],
    },

    /* ── 3 ─ HIGH ─ Ischemic Stroke ─────────────────────────────── */
    {
        case_number: "CASE-006",
        title: "Acute Ischemic Stroke (Left MCA)",
        specialty: "Neurology",
        patient_info: "62-year-old female, housewife",
        severity: "High",
        confidence: 92,
        difficulty_level: "Advanced",
        estimated_time_minutes: 20,

        chief_complaint: "Sudden right-sided weakness and speech difficulty for 90 minutes",
        history_of_present_illness:
            "Mrs. Fatima, 62-year-old housewife, brought by husband who witnessed sudden onset of inability to speak and right-sided weakness while watching TV 90 minutes ago. No preceding headache, trauma, or illness. Known atrial fibrillation, non-compliant with warfarin for 3 months.",
        symptoms: ["Right-sided hemiparesis", "Expressive aphasia", "Right facial droop"],
        past_medical_history: [
            { condition: "Atrial Fibrillation", duration: "4 years", controlled: "false" },
            { condition: "Hypertension", duration: "12 years", controlled: "partial" },
        ],
        medications: ["Amlodipine 5 mg OD", "Warfarin (non-compliant past 3 months)"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Never", alcohol: "None", occupation: "Housewife", exercise: "Minimal" },
        family_history: "Mother had stroke at 70.",

        vital_signs: {
            temperature: "37.0 °C",
            heart_rate: "88 bpm, irregular",
            blood_pressure: "178/102 mmHg",
            respiratory_rate: "18 breaths/min",
            oxygen_saturation: "97% on room air",
        },
        general_examination: "Alert but distressed. Expressive aphasia, right facial droop. Not following complex commands.",
        systemic_examination: {
            neurological: "GCS 14/15 (E4 V3 M5). Expressive aphasia. Right UMN facial droop. Right UL power 1/5, LL 2/5. Right plantar upgoing. NIHSS ≈ 14.",
            cardiovascular: "Irregularly irregular pulse. S1 variable. No murmurs.",
            respiratory: "Clear bilaterally.",
            abdominal: "Soft, non-tender.",
        },

        laboratory_results: [
            { test: "Blood Glucose", results: { glucose: "112 mg/dL" }, interpretation: "Normal — excludes hypoglycemic stroke mimic" },
            { test: "INR / Coagulation", results: { PT: "16 seconds", INR: "1.3" }, interpretation: "Subtherapeutic anticoagulation" },
            { test: "Complete Blood Count", results: { WBC: "9,200/µL", Platelets: "195,000/µL", Hemoglobin: "12.8 g/dL" }, interpretation: "Normal" },
            { test: "ECG", results: { finding: "Atrial fibrillation, controlled rate. No ischemic changes." }, interpretation: "Confirms AF as embolic source" },
        ],
        imaging_findings: [
            { test: "CT Brain (Non-contrast)", findings: "No hemorrhage. Hyperdense MCA sign on left.", interpretation: "Excludes bleed; hyperdense MCA suggests acute thrombus" },
            { test: "MRI Brain (DWI)", findings: "Restricted diffusion in left MCA territory — frontal and parietal cortex.", interpretation: "Confirms acute left MCA infarct" },
        ],
        other_investigations: [
            { test: "Carotid Doppler", results: { finding: "Mild bilateral plaques, no significant stenosis" }, interpretation: "Cardioembolic source more likely than large artery disease" },
        ],

        differential_diagnosis: [
            { diagnosis: "Acute Ischemic Stroke — cardioembolic", likelihood: "Very High", reasoning: "Sudden focal deficit, AF, subtherapeutic INR, MRI confirms infarct" },
            { diagnosis: "Hemorrhagic stroke", likelihood: "Very Low", reasoning: "CT excludes hemorrhage" },
            { diagnosis: "Todd's paralysis (post-seizure)", likelihood: "Very Low", reasoning: "No seizure history or activity" },
            { diagnosis: "Complicated migraine", likelihood: "Very Low", reasoning: "No headache or aura, focal deficit persistent" },
        ],
        final_diagnosis: "Acute Ischemic Stroke — Left Middle Cerebral Artery, Cardioembolic from Atrial Fibrillation",
        diagnosis_reasoning: "Witnessed sudden onset, focal neurological deficit (NIHSS 14), within thrombolytic window. Imaging confirms acute left MCA infarction. AF with subtherapeutic anticoagulation is the most likely embolic source.",

        management_plan: {
            immediate: ["Assess IV thrombolysis eligibility (within 4.5 h window)", "If large-vessel occlusion: mechanical thrombectomy up to 24 h in selected patients", "Permissive hypertension unless >220/120", "NIHSS assessment, neurology consult"],
            short_term: ["Stroke unit admission", "Swallow assessment before oral intake", "DVT prophylaxis", "Statin therapy"],
            long_term: ["Long-term anticoagulation (DOAC preferred over warfarin)", "Secondary prevention — BP, lipids, AF rate/rhythm control", "Rehabilitation — physio, speech, occupational therapy"],
        },
        recommendations: [
            "Time-sensitive: thrombolysis or thrombectomy within window",
            "Switch to DOAC for AF anticoagulation — better compliance",
            "Multidisciplinary rehabilitation plan",
        ],
        tests: ["Echocardiogram (LA thrombus?)", "Carotid Doppler", "24-hr Holter if AF not yet established", "Lipid profile, HbA1c"],
        prognosis: "Variable. Early reperfusion improves outcome significantly. Long-term disability common with NIHSS >10. Recurrence risk high if anticoagulation not optimized.",

        learning_objectives: [
            "Recognize stroke red flags and FAST assessment",
            "Apply thrombolysis eligibility criteria",
            "Differentiate ischemic from hemorrhagic stroke",
            "Plan secondary stroke prevention",
        ],
        key_teaching_points: [
            "Time is brain — every minute, 1.9 million neurons die",
            "AF accounts for ~20% of all ischemic strokes",
            "Subtherapeutic INR (<2) does not prevent embolic stroke",
            "Permissive hypertension preserves penumbra perfusion",
        ],
        clinical_pearls: [
            "Hyperdense MCA sign on CT is an early marker of large vessel occlusion",
            "DOACs are now preferred over warfarin for non-valvular AF",
            "Always check glucose — hypoglycemia is a common stroke mimic",
        ],
        common_pitfalls: [
            "Lowering BP aggressively — worsens cerebral perfusion",
            "Missing the thrombolysis window by delaying CT",
            "Restarting anticoagulation too early after large stroke (hemorrhagic transformation)",
        ],
        references: [
            "AHA/ASA 2019 Guidelines for the Early Management of Acute Ischemic Stroke",
            "ESO 2021 Guidelines on Intravenous Thrombolysis",
        ],

        questions: [
            {
                question: "What is the time window for IV thrombolysis with tPA?",
                options: ["6 hours", "4.5 hours", "12 hours", "24 hours"],
                correct: 1,
                explanation: "The standard window for IV alteplase (tPA) is within 4.5 hours of symptom onset.",
            },
            {
                question: "What is the most likely mechanism of stroke in this patient?",
                options: ["Lacunar infarct", "Cardioembolic from AF", "Watershed infarct", "Venous sinus thrombosis"],
                correct: 1,
                explanation: "Untreated AF is a major cardioembolic source, accounting for most embolic strokes in this presentation.",
            },
        ],
        theory_questions: [
            {
                question: "List the absolute and relative contraindications for IV thrombolysis in ischemic stroke.",
                model_answer: "Absolute: active intracranial hemorrhage, recent (<3 months) intracranial/spinal surgery or head trauma, suspected SAH, intracranial neoplasm/AVM/aneurysm, active bleeding, severe uncontrolled hypertension (>185/110 despite treatment), platelets <100,000, INR >1.7 or current anticoagulant use, recent gastrointestinal bleed (<21 days). Relative: minor or rapidly improving symptoms, seizure at onset with post-ictal deficit, pregnancy, recent MI (3 months), major surgery (14 days), recent stroke (3 months).",
                keywords: ["intracranial hemorrhage", "blood pressure 185/110", "INR", "platelets", "anticoagulant", "recent surgery"],
            },
        ],

        description: "Elderly woman with AF presents within window for stroke intervention — left MCA territory infarct.",
        icon: "Brain",
        color: "bg-purple-500",
        tags: ["Neurology", "Emergency", "Stroke", "Thrombolysis"],
    },

    /* ── 4 ─ HIGH ─ Septic Shock ────────────────────────────────── */
    {
        case_number: "CASE-007",
        title: "Septic Shock from Urinary Source",
        specialty: "Critical Care",
        patient_info: "72-year-old male, retired teacher",
        severity: "High",
        confidence: 90,
        difficulty_level: "Advanced",
        estimated_time_minutes: 22,

        chief_complaint: "Fever, confusion, and decreased urine output for 1 day",
        history_of_present_illness:
            "Mr. Ahmed, 72M with chronic indwelling urinary catheter (6 months for BPH), brought by son with 1-day history of high fever, worsening confusion, and oliguria. 3 days of dysuria preceding. Now lethargic, not following instructions.",
        symptoms: ["High fever", "Confusion", "Oliguria", "Dysuria", "Hypotension"],
        past_medical_history: [
            { condition: "Benign Prostatic Hyperplasia", duration: "8 years", controlled: "partial" },
            { condition: "Type 2 Diabetes", duration: "15 years", controlled: "suboptimal" },
            { condition: "CKD Stage 3", duration: "4 years", controlled: "stable" },
        ],
        medications: ["Tamsulosin 0.4 mg OD", "Metformin 500 mg BD", "Gliclazide 80 mg OD"],
        allergies: ["Penicillin — rash"],
        social_history: { smoking: "Ex-smoker (20 years quit)", alcohol: "None", occupation: "Retired teacher", living_situation: "With family" },
        family_history: "Father — CAD. Mother — DM.",

        vital_signs: {
            temperature: "39.4 °C",
            heart_rate: "128 bpm",
            blood_pressure: "88/52 mmHg",
            respiratory_rate: "26 breaths/min",
            oxygen_saturation: "93% on room air",
        },
        general_examination: "Lethargic, responds slowly. Warm peripheries, bounding pulses. Mottled skin over knees. Foley catheter draining minimal cloudy urine.",
        systemic_examination: {
            neurological: "GCS 12/15 (E3 V3 M6). Disoriented to time and place.",
            cardiovascular: "Tachycardia. Capillary refill 4 seconds.",
            respiratory: "Bilateral basal crackles. Tachypneic.",
            abdominal: "Suprapubic tenderness. Bladder palpable.",
        },

        laboratory_results: [
            { test: "Complete Blood Count", results: { WBC: "18,400/µL (92% neutrophils)", Platelets: "98,000/µL", Hemoglobin: "11.2 g/dL" }, interpretation: "Leukocytosis with left shift; thrombocytopenia concerning for sepsis-induced DIC" },
            { test: "Serum Lactate", results: { lactate: "4.2 mmol/L" }, interpretation: "Elevated — tissue hypoperfusion, septic shock marker" },
            { test: "Renal Function", results: { Creatinine: "2.8 mg/dL (baseline 1.4)", BUN: "62 mg/dL" }, interpretation: "Acute kidney injury on CKD" },
            { test: "Urinalysis", results: { WBC: ">100/HPF", Nitrites: "positive", Bacteria: "many" }, interpretation: "Florid UTI — likely septic source" },
            { test: "Blood Cultures", results: { status: "Pending — drawn before antibiotics" }, interpretation: "Crucial for targeted therapy" },
        ],
        imaging_findings: [
            { test: "Bedside US (Kidney/Bladder)", findings: "No hydronephrosis. Catheter in bladder.", interpretation: "Obstruction excluded; catheter likely source" },
        ],
        other_investigations: [
            { test: "Procalcitonin", results: { procalcitonin: "8.2 ng/mL" }, interpretation: "Markedly elevated — bacterial sepsis" },
            { test: "qSOFA", results: { score: "3/3 (altered mental status, RR≥22, SBP≤100)" }, interpretation: "High mortality risk" },
        ],

        differential_diagnosis: [
            { diagnosis: "Septic shock — urinary source", likelihood: "Very High", reasoning: "Sepsis criteria + hypotension despite fluids + lactate >2 + urinary source" },
            { diagnosis: "Cardiogenic shock", likelihood: "Low", reasoning: "Warm peripheries, no chest pain or ECG changes" },
            { diagnosis: "Hypovolemic shock", likelihood: "Low", reasoning: "Not consistent with febrile presentation" },
            { diagnosis: "Anaphylaxis", likelihood: "Very Low", reasoning: "No trigger, no rash/wheeze" },
        ],
        final_diagnosis: "Septic Shock secondary to Catheter-Associated Urinary Tract Infection (CAUTI)",
        diagnosis_reasoning: "Meets Sepsis-3 criteria — suspected infection + qSOFA 3, persistent hypotension requiring vasopressors anticipated, lactate >2 mmol/L. Urinary source identified by urinalysis and chronic catheter.",

        management_plan: {
            immediate: ["Sepsis Hour-1 bundle: blood cultures × 2, broad-spectrum IV antibiotics (avoid β-lactam, use Aztreonam + Vancomycin given allergy)", "30 mL/kg crystalloid bolus", "Noradrenaline if MAP <65 after fluids", "Replace urinary catheter", "ICU admission"],
            short_term: ["Source control — assess for pyelonephritis/abscess", "De-escalate antibiotics per culture sensitivity", "Glucose control (avoid hyperglycemia in sepsis)", "Stress ulcer and DVT prophylaxis"],
            long_term: ["Address chronic catheter — intermittent self-catheterization if feasible", "Optimize BPH and diabetes management", "Vaccinations — pneumococcal, influenza"],
        },
        recommendations: [
            "Hour-1 bundle adherence is life-saving",
            "Penicillin allergy: use Aztreonam + Vancomycin or Carbapenem after allergy assessment",
            "Noradrenaline is first-line vasopressor",
            "Source control — change/remove catheter early",
        ],
        tests: ["Repeat lactate at 2-4 hours", "Daily cultures until source clear", "Serial creatinine and urine output", "Echo if cardiac involvement suspected"],
        prognosis: "Septic shock mortality 30-50%. Early goal-directed therapy reduces mortality. Recovery depends on comorbidities and source control.",

        learning_objectives: [
            "Apply Sepsis-3 criteria and qSOFA",
            "Execute the Surviving Sepsis Hour-1 Bundle",
            "Recognize the role of source control",
            "Manage antibiotics in penicillin allergy",
        ],
        key_teaching_points: [
            "Sepsis-3: life-threatening organ dysfunction from dysregulated host response",
            "Septic shock = sepsis + vasopressor need + lactate >2 despite fluids",
            "qSOFA ≥2 predicts poor outcome",
            "Source control is as important as antibiotics",
        ],
        clinical_pearls: [
            "Indwelling urinary catheters dramatically increase CAUTI risk — review necessity daily",
            "Procalcitonin can help differentiate bacterial from viral/inflammatory causes",
            "Lactate clearance >10% in 2 hours predicts better outcome",
        ],
        common_pitfalls: [
            "Waiting for cultures before starting antibiotics — every hour delay increases mortality",
            "Inadequate fluid resuscitation",
            "Missing source — undrained abscess or obstruction",
        ],
        references: [
            "Surviving Sepsis Campaign Guidelines 2021",
            "Sepsis-3 Consensus Definitions (JAMA 2016)",
        ],

        questions: [
            {
                question: "What defines septic shock?",
                options: ["Fever >39°C plus tachycardia", "Sepsis with vasopressors AND lactate >2 mmol/L despite fluid resuscitation", "Any infection with hypotension", "Positive blood cultures"],
                correct: 1,
                explanation: "Septic shock (Sepsis-3) is sepsis with persistent hypotension requiring vasopressors to maintain MAP ≥65 AND serum lactate >2 mmol/L despite fluid resuscitation.",
            },
            {
                question: "What is the first vasopressor of choice in septic shock?",
                options: ["Dopamine", "Adrenaline", "Noradrenaline", "Vasopressin"],
                correct: 2,
                explanation: "Noradrenaline is first-line per the Surviving Sepsis Campaign guidelines.",
            },
        ],
        theory_questions: [
            {
                question: "Describe the components of the Surviving Sepsis Campaign Hour-1 Bundle.",
                model_answer: "The Hour-1 Bundle includes: (1) Measure lactate level — repeat if initial >2 mmol/L; (2) Obtain blood cultures BEFORE administering antibiotics; (3) Administer broad-spectrum antibiotics within 1 hour; (4) Begin rapid administration of 30 mL/kg crystalloid for hypotension or lactate ≥4 mmol/L; (5) Apply vasopressors if hypotensive during or after fluid resuscitation to maintain MAP ≥65 mmHg.",
                keywords: ["lactate", "blood cultures", "antibiotics 1 hour", "30 mL/kg", "vasopressors", "MAP 65"],
            },
        ],

        description: "Elderly diabetic with chronic urinary catheter develops septic shock — urgent bundle care needed.",
        icon: "AlertTriangle",
        color: "bg-red-600",
        tags: ["Critical Care", "Emergency", "Sepsis", "Infectious Disease"],
    },

    /* ── 5 ─ MEDIUM ─ Community-Acquired Pneumonia ─────────────── */
    {
        case_number: "CASE-008",
        title: "Community-Acquired Pneumonia",
        specialty: "Pulmonology",
        patient_info: "68-year-old male, retired engineer",
        severity: "Medium",
        confidence: 88,
        difficulty_level: "Intermediate",
        estimated_time_minutes: 15,

        chief_complaint: "Fever, productive cough, and shortness of breath for 5 days",
        history_of_present_illness:
            "Mr. Hassan, 68M, presents with 5 days of fever (up to 39°C), productive cough with rust-colored sputum, and worsening dyspnea. Right-sided pleuritic chest pain. Unable to climb stairs. Reduced oral intake. No recent travel or sick contacts.",
        symptoms: ["Productive cough", "Fever", "Dyspnea", "Pleuritic chest pain"],
        past_medical_history: [
            { condition: "Type 2 Diabetes", duration: "10 years", controlled: "good" },
            { condition: "COPD", duration: "6 years", controlled: "stable" },
        ],
        medications: ["Metformin 1 g BD", "Tiotropium inhaler OD", "Salbutamol PRN"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Ex-smoker, 30 pack-years (quit 5 years ago)", alcohol: "Occasional", occupation: "Retired engineer", living_situation: "With wife" },
        family_history: "Non-contributory.",

        vital_signs: {
            temperature: "38.9 °C",
            heart_rate: "104 bpm",
            blood_pressure: "128/78 mmHg",
            respiratory_rate: "24 breaths/min",
            oxygen_saturation: "92% on room air",
        },
        general_examination: "Looks unwell, mildly dehydrated. Mild use of accessory muscles. No peripheral cyanosis.",
        systemic_examination: {
            respiratory: "Reduced air entry right lower zone with bronchial breathing, coarse crackles, increased vocal resonance.",
            cardiovascular: "Tachycardia. Normal heart sounds.",
            abdominal: "Soft, non-tender.",
            neurological: "Alert, GCS 15/15.",
        },

        laboratory_results: [
            { test: "Complete Blood Count", results: { WBC: "14,800/µL (left shift)", Platelets: "310,000/µL", Hemoglobin: "13.4 g/dL" }, interpretation: "Bacterial leukocytosis" },
            { test: "CRP", results: { CRP: "186 mg/L (ref <5)" }, interpretation: "Markedly elevated — bacterial inflammation" },
            { test: "Procalcitonin", results: { procalcitonin: "2.4 ng/mL" }, interpretation: "Bacterial etiology likely" },
            { test: "Sputum Gram Stain", results: { finding: "Gram-positive diplococci" }, interpretation: "Suggests Streptococcus pneumoniae" },
            { test: "Arterial Blood Gas", results: { pH: "7.42", PaO2: "68 mmHg", PaCO2: "36 mmHg" }, interpretation: "Mild hypoxemia, no acidosis" },
        ],
        imaging_findings: [
            { test: "Chest X-Ray", findings: "Right lower lobe consolidation with air bronchograms. No effusion.", interpretation: "Lobar pneumonia, classic Streptococcus pneumoniae" },
        ],
        other_investigations: [
            { test: "CURB-65", results: { score: "2/5 (age, RR ~25)" }, interpretation: "Moderate severity — hospital admission warranted" },
        ],

        differential_diagnosis: [
            { diagnosis: "Community-acquired pneumonia", likelihood: "Very High", reasoning: "Fever, productive cough, focal consolidation on CXR, leukocytosis" },
            { diagnosis: "COPD exacerbation", likelihood: "Moderate", reasoning: "Has COPD but consolidation more consistent with pneumonia" },
            { diagnosis: "Pulmonary embolism", likelihood: "Low", reasoning: "No risk factors, consolidation not typical for PE" },
            { diagnosis: "Lung malignancy with post-obstructive pneumonia", likelihood: "Consider", reasoning: "Significant smoking history — needs follow-up CXR" },
        ],
        final_diagnosis: "Community-Acquired Pneumonia (right lower lobe) — likely Streptococcus pneumoniae",
        diagnosis_reasoning: "Acute febrile illness with focal pneumonic consolidation, leukocytosis, raised inflammatory markers, and gram-positive diplococci on sputum. CURB-65 of 2 supports hospital admission.",

        management_plan: {
            immediate: ["Admit per CURB-65 = 2", "Empirical antibiotics: Ceftriaxone 2g IV OD + Azithromycin 500 mg IV OD", "Supplemental O₂ to keep SpO₂ ≥92%", "IV fluids if dehydrated"],
            short_term: ["De-escalate based on culture results", "Switch to oral when stable (typically 48-72 hours)", "Total antibiotic duration 5-7 days"],
            long_term: ["Pneumococcal and influenza vaccination on discharge", "Follow-up CXR at 6 weeks to confirm resolution and exclude underlying malignancy", "Smoking cessation reinforcement"],
        },
        recommendations: [
            "CURB-65 guides admission decision",
            "Empirical antibiotics within 4 hours of presentation",
            "Vaccinate after recovery to prevent recurrence",
            "Repeat imaging in 6 weeks to ensure clearance",
        ],
        tests: ["Blood cultures", "Urinary antigens (Pneumococcus, Legionella)", "Follow-up CXR at 6 weeks"],
        prognosis: "Good with appropriate antibiotics. Mortality ~5-10% in hospitalized patients depending on severity and comorbidities.",

        learning_objectives: [
            "Apply CURB-65 to risk-stratify pneumonia",
            "Select empirical antibiotics for CAP",
            "Identify red flags requiring hospitalization or ICU",
            "Plan post-pneumonia follow-up",
        ],
        key_teaching_points: [
            "Streptococcus pneumoniae is the commonest cause of CAP",
            "CURB-65: Confusion, Urea >7, RR ≥30, BP <90/60, Age ≥65",
            "Rust-coloured sputum classic for pneumococcus",
            "Always follow up with CXR to exclude underlying malignancy in smokers",
        ],
        clinical_pearls: [
            "Procalcitonin helps differentiate bacterial from viral pneumonia",
            "Always vaccinate post-recovery to prevent recurrence",
            "Atypical pneumonia (Mycoplasma, Legionella) needs macrolide coverage",
        ],
        common_pitfalls: [
            "Missing post-obstructive pneumonia from malignancy",
            "Not escalating antibiotics for non-improvement at 72 hours",
            "Overlooking parapneumonic effusion or empyema",
        ],
        references: [
            "BTS Guidelines for the Management of CAP in Adults (2009, update 2015)",
            "IDSA/ATS Guidelines for CAP (2019)",
        ],

        questions: [
            {
                question: "What scoring system helps decide admission for pneumonia?",
                options: ["Wells score", "GRACE score", "CURB-65", "CHA₂DS₂-VASc"],
                correct: 2,
                explanation: "CURB-65 (Confusion, Urea >7, RR ≥30, BP <90/60, age ≥65) is the standard severity score for CAP.",
            },
            {
                question: "Most common bacterial cause of CAP?",
                options: ["Haemophilus influenzae", "Streptococcus pneumoniae", "Mycoplasma pneumoniae", "Klebsiella pneumoniae"],
                correct: 1,
                explanation: "Streptococcus pneumoniae remains the most common cause of community-acquired pneumonia globally.",
            },
        ],
        theory_questions: [
            {
                question: "Discuss the criteria and clinical use of CURB-65 in CAP.",
                model_answer: "CURB-65 stratifies pneumonia severity using five criteria: Confusion (new), Urea >7 mmol/L, Respiratory rate ≥30, Blood pressure (SBP <90 or DBP ≤60), and age ≥65. Each scores 1 point. Score 0-1: outpatient management. Score 2: short hospital stay or supervised outpatient. Score 3-5: hospital admission, consider ICU. It helps guide antibiotic intensity, site of care, and prognosis (30-day mortality rises from <1% at score 0 to >20% at score 5).",
                keywords: ["confusion", "urea", "respiratory rate", "blood pressure", "65", "mortality"],
            },
        ],

        description: "Elderly ex-smoker with classic lobar pneumonia — CURB-65 guides admission and treatment.",
        icon: "Wind",
        color: "bg-blue-500",
        tags: ["Pulmonology", "Infectious Disease", "Pneumonia"],
    },

    /* ── 6 ─ MEDIUM ─ Acute Appendicitis ────────────────────────── */
    {
        case_number: "CASE-009",
        title: "Acute Appendicitis",
        specialty: "General Surgery",
        patient_info: "22-year-old male, university student",
        severity: "Medium",
        confidence: 92,
        difficulty_level: "Intermediate",
        estimated_time_minutes: 15,

        chief_complaint: "Right lower abdominal pain for 18 hours, migrated from peri-umbilical region",
        history_of_present_illness:
            "Ali, 22M engineering student, with 18 hours of abdominal pain starting peri-umbilical and shifting to RLQ 6 hours ago. Constant, worse with movement. Two episodes of vomiting, anorexia. No diarrhea or urinary symptoms.",
        symptoms: ["Migratory abdominal pain", "Nausea", "Anorexia", "Low-grade fever"],
        past_medical_history: [],
        medications: ["None"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Never", alcohol: "Occasional", occupation: "Student", living_situation: "Hostel" },
        family_history: "Non-contributory.",

        vital_signs: {
            temperature: "37.9 °C",
            heart_rate: "98 bpm",
            blood_pressure: "124/76 mmHg",
            respiratory_rate: "18 breaths/min",
            oxygen_saturation: "99% on room air",
        },
        general_examination: "Mildly distressed by pain. Walks bent forward. Reluctant to move on examination couch.",
        systemic_examination: {
            abdominal: "Tenderness max at McBurney's point with guarding. Rovsing's sign positive. Psoas/obturator positive. Rebound in RLQ. Bowel sounds present.",
            cardiovascular: "Normal S1, S2. No murmurs.",
            respiratory: "Clear.",
            neurological: "Alert.",
        },

        laboratory_results: [
            { test: "Complete Blood Count", results: { WBC: "13,500/µL (84% neutrophils)", Hemoglobin: "14.6 g/dL" }, interpretation: "Neutrophilic leukocytosis — acute inflammation" },
            { test: "CRP", results: { CRP: "62 mg/L" }, interpretation: "Elevated — supports inflammation" },
            { test: "Urinalysis", results: { findings: "No WBC, no nitrites" }, interpretation: "Excludes UTI" },
            { test: "Alvarado Score", results: { score: "8/10" }, interpretation: "High probability of appendicitis (≥7 = surgery)" },
        ],
        imaging_findings: [
            { test: "Abdominal Ultrasound", findings: "Non-compressible blind-ending tubular structure RLQ, 9 mm diameter, peri-appendiceal fat stranding.", interpretation: "Diagnostic of acute appendicitis" },
        ],
        other_investigations: [],

        differential_diagnosis: [
            { diagnosis: "Acute Appendicitis", likelihood: "Very High", reasoning: "Classic migratory pain + McBurney tenderness + Alvarado 8 + US findings" },
            { diagnosis: "Mesenteric adenitis", likelihood: "Low", reasoning: "More common in children, no preceding URTI" },
            { diagnosis: "Crohn's disease (terminal ileitis)", likelihood: "Low", reasoning: "Acute presentation, no chronic GI symptoms" },
            { diagnosis: "Right ureteric colic", likelihood: "Low", reasoning: "No hematuria, urinalysis clear" },
        ],
        final_diagnosis: "Acute Uncomplicated Appendicitis",
        diagnosis_reasoning: "Classic history of migratory pain, anorexia, signs of focal peritonism at McBurney's point, positive Rovsing/psoas/obturator signs, neutrophilic leukocytosis, elevated CRP, and ultrasound confirmation.",

        management_plan: {
            immediate: ["NPO, IV fluids", "IV analgesia (Paracetamol + Opioid)", "Antiemetic", "Pre-op antibiotics: Ceftriaxone + Metronidazole IV", "Surgical consent and consult"],
            short_term: ["Laparoscopic appendectomy — gold standard", "Single dose pre-op antibiotics sufficient for uncomplicated cases", "Mobilize and eat as tolerated post-op"],
            long_term: ["Discharge typically within 24-48 hours", "Resume normal activity within 1-2 weeks", "Histopathology review of removed appendix"],
        },
        recommendations: [
            "Operate within 24 hours to reduce perforation risk",
            "Laparoscopic approach preferred over open",
            "Antibiotic-only therapy increasingly studied — selected cases only",
        ],
        tests: ["Pre-operative bloods including coagulation", "Pregnancy test (when female)", "Histopathology post-op"],
        prognosis: "Excellent for uncomplicated cases. Perforation rate rises with delay >24 hours. Complications <5% with laparoscopic approach.",

        learning_objectives: [
            "Recognize the classical history of appendicitis",
            "Apply Alvarado score for clinical decision-making",
            "Identify physical signs and their pathophysiology",
            "Understand operative versus non-operative options",
        ],
        key_teaching_points: [
            "Pain migration is the most reliable symptom",
            "Alvarado ≥7 strongly supports surgery; 4-6 needs imaging",
            "Perforation risk rises significantly after 24-36 hours",
            "Laparoscopic appendectomy reduces wound infection, hospital stay",
        ],
        clinical_pearls: [
            "Pregnancy test on all reproductive-age females with abdominal pain",
            "CT is more sensitive than US in obese patients or when diagnosis unclear",
            "Atypical presentations common in elderly and young children",
        ],
        common_pitfalls: [
            "Missing retrocecal appendicitis (psoas sign helps)",
            "Delaying surgery hoping for resolution",
            "Forgetting differentials in females (ovarian pathology)",
        ],
        references: [
            "World Society of Emergency Surgery Guidelines for Appendicitis (2020)",
            "NICE Suspected Acute Appendicitis Pathway",
        ],

        questions: [
            {
                question: "What sign refers to pain in the RLQ on palpation of the LLQ?",
                options: ["Murphy's sign", "Rovsing's sign", "McBurney's sign", "Cullen's sign"],
                correct: 1,
                explanation: "Rovsing's sign is positive when LLQ palpation elicits RLQ pain — classic for appendicitis.",
            },
            {
                question: "What is the definitive treatment for acute appendicitis?",
                options: ["IV antibiotics alone", "Conservative observation", "Appendectomy", "Endoscopic drainage"],
                correct: 2,
                explanation: "Appendectomy (typically laparoscopic) is the definitive treatment.",
            },
        ],
        theory_questions: [
            {
                question: "Describe the natural history and pathophysiology of acute appendicitis.",
                model_answer: "Acute appendicitis begins with luminal obstruction, usually from fecalith, lymphoid hyperplasia, or rarely tumor. Obstruction leads to mucus accumulation, increased intraluminal pressure, venous congestion, and mucosal ischemia, allowing bacterial translocation. The inflamed appendix first irritates visceral peritoneum (peri-umbilical pain from T10 dermatome), then progresses to involve parietal peritoneum at McBurney's point (sharp RLQ pain). Untreated, it progresses to gangrene and perforation within 24-72 hours, leading to local abscess or diffuse peritonitis.",
                keywords: ["luminal obstruction", "fecalith", "visceral peritoneum", "parietal", "McBurney", "perforation"],
            },
        ],

        description: "Classic appendicitis in a young adult — migratory pain with peritoneal signs.",
        icon: "Activity",
        color: "bg-amber-500",
        tags: ["Surgery", "Emergency", "Abdominal Pain"],
    },

    /* ── 7 ─ MEDIUM ─ Acute Pancreatitis ────────────────────────── */
    {
        case_number: "CASE-010",
        title: "Acute Pancreatitis (Alcoholic)",
        specialty: "Gastroenterology",
        patient_info: "45-year-old male, factory worker",
        severity: "Medium",
        confidence: 90,
        difficulty_level: "Intermediate",
        estimated_time_minutes: 18,

        chief_complaint: "Severe epigastric pain radiating to the back for 6 hours",
        history_of_present_illness:
            "Mr. Bilal, 45M factory worker, 6-hour history of severe constant epigastric pain radiating through to back, 8/10. Multiple vomiting. Heavy alcohol intake over past weekend. No prior similar episodes. No gallstone history.",
        symptoms: ["Epigastric pain", "Radiation to back", "Vomiting", "Nausea"],
        past_medical_history: [
            { condition: "Hypertriglyceridemia", duration: "2 years", controlled: "false" },
        ],
        medications: ["None regular"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "10/day", alcohol: "8-10 units/day × 15 years", occupation: "Factory worker", exercise: "None" },
        family_history: "Father — alcohol-related liver disease.",

        vital_signs: {
            temperature: "37.6 °C",
            heart_rate: "112 bpm",
            blood_pressure: "118/72 mmHg",
            respiratory_rate: "20 breaths/min",
            oxygen_saturation: "96% on room air",
        },
        general_examination: "Anxious and in pain. Mildly dehydrated. No jaundice. No Grey-Turner or Cullen sign.",
        systemic_examination: {
            abdominal: "Epigastric tenderness with guarding. No rebound. Reduced bowel sounds. No mass. No organomegaly.",
            cardiovascular: "Tachycardia. Normal heart sounds.",
            respiratory: "Clear.",
            neurological: "Alert, GCS 15/15.",
        },

        laboratory_results: [
            { test: "Serum Lipase", results: { lipase: "1,240 U/L (ref <60)" }, interpretation: "Markedly elevated — diagnostic (>3× ULN)" },
            { test: "Serum Amylase", results: { amylase: "820 U/L" }, interpretation: "Elevated, supports diagnosis" },
            { test: "Liver Function", results: { ALT: "42", AST: "65", ALP: "112", Bilirubin: "1.1 mg/dL" }, interpretation: "Mildly elevated transaminases; non-obstructive — gallstones less likely" },
            { test: "Lipid Profile", results: { Triglycerides: "320 mg/dL", Cholesterol: "245 mg/dL" }, interpretation: "Hypertriglyceridemia — contributory" },
            { test: "Complete Blood Count", results: { WBC: "13,200/µL", Hematocrit: "48%" }, interpretation: "Leukocytosis, hemoconcentration" },
        ],
        imaging_findings: [
            { test: "Abdominal Ultrasound", findings: "No gallstones. CBD not dilated. Pancreas obscured by bowel gas.", interpretation: "Excludes biliary etiology" },
            { test: "CT Abdomen (Contrast)", findings: "Diffuse pancreatic edema with peri-pancreatic fat stranding. No necrosis or collections.", interpretation: "Acute interstitial edematous pancreatitis (mild)" },
        ],
        other_investigations: [
            { test: "Glasgow Score", results: { score: "1/8 (mild)" }, interpretation: "Mild pancreatitis, supportive care appropriate" },
        ],

        differential_diagnosis: [
            { diagnosis: "Acute Pancreatitis — alcoholic", likelihood: "Very High", reasoning: "Classic pain + lipase >3× ULN + alcohol history + imaging confirms" },
            { diagnosis: "Gallstone pancreatitis", likelihood: "Low", reasoning: "US shows no stones, normal CBD, no obstructive LFT pattern" },
            { diagnosis: "Hypertriglyceridemia-induced", likelihood: "Possible contributory", reasoning: "TG elevated but not >1000 mg/dL threshold" },
            { diagnosis: "Peptic ulcer perforation", likelihood: "Low", reasoning: "No pneumoperitoneum, lipase markedly elevated" },
        ],
        final_diagnosis: "Acute Mild Interstitial Edematous Pancreatitis — Alcohol-induced",
        diagnosis_reasoning: "Meets 2 of 3 Atlanta criteria: characteristic epigastric pain radiating to back AND lipase >3× ULN. Imaging confirms diagnosis. Heavy alcohol intake is most likely etiology; gallstones excluded by US.",

        management_plan: {
            immediate: ["NPO with aggressive IV fluid resuscitation (Ringer's Lactate)", "IV opioid analgesia (avoid morphine, use Fentanyl/Pethidine)", "IV antiemetics", "Monitor urine output, vital signs"],
            short_term: ["Resume early oral feeding once pain controlled and vomiting resolved (24-72 hours)", "No prophylactic antibiotics in mild pancreatitis", "Treat alcohol withdrawal — Chlordiazepoxide", "Thiamine supplementation"],
            long_term: ["Alcohol cessation counseling and support", "Manage hypertriglyceridemia — fibrates, lifestyle", "Outpatient gastroenterology follow-up", "Consider AUDIT screening"],
        },
        recommendations: [
            "Aggressive fluid resuscitation first 24 hours",
            "Early oral feeding when tolerated",
            "No prophylactic antibiotics in mild cases",
            "Identify and treat etiology",
        ],
        tests: ["Serial lipase, electrolytes", "Repeat CT only if deterioration or complications suspected", "Lipid panel post-recovery"],
        prognosis: "Mild pancreatitis has <1% mortality. Recurrence common if alcohol continues. Severe cases (20%) have 15-25% mortality.",

        learning_objectives: [
            "Apply Atlanta diagnostic criteria for pancreatitis",
            "Differentiate mild from severe disease (Glasgow, APACHE-II, BISAP)",
            "Manage acute pancreatitis according to severity",
            "Recognize complications: necrosis, pseudocyst, infection",
        ],
        key_teaching_points: [
            "Diagnosis: 2 of 3 — characteristic pain, lipase >3× ULN, characteristic imaging",
            "Gallstones and alcohol cause ~80% of cases",
            "Aggressive early fluids reduce complications",
            "Severe pancreatitis requires ICU and may need ERCP, surgery",
        ],
        clinical_pearls: [
            "Lipase is more specific than amylase and stays elevated longer",
            "Grey-Turner and Cullen signs indicate retroperitoneal hemorrhage — severe disease",
            "Hypertriglyceridemia threshold for causing pancreatitis is usually >1000 mg/dL",
        ],
        common_pitfalls: [
            "Underestimating fluid requirements in first 24 hours",
            "Using prophylactic antibiotics in mild cases — increases resistance",
            "Missing biliary etiology — always image for gallstones",
        ],
        references: [
            "American College of Gastroenterology Guidelines for Acute Pancreatitis (2013)",
            "Revised Atlanta Classification (2012)",
        ],

        questions: [
            {
                question: "Which two criteria confirm acute pancreatitis (Atlanta)?",
                options: ["Pain alone + US", "Pain + lipase/amylase >3× ULN", "Lipase elevation alone", "CT findings only"],
                correct: 1,
                explanation: "Atlanta classification requires 2 of: characteristic pain, lipase/amylase >3× upper limit, or characteristic imaging.",
            },
            {
                question: "Most common cause of acute pancreatitis worldwide?",
                options: ["Alcohol", "Gallstones", "Drugs", "Idiopathic"],
                correct: 1,
                explanation: "Gallstones are commonest globally, followed by alcohol — together ~80% of cases.",
            },
        ],
        theory_questions: [
            {
                question: "Outline the principles of initial management of acute pancreatitis.",
                model_answer: "Initial management focuses on: (1) Aggressive IV fluid resuscitation with Ringer's lactate — first 24-48 hours critical for preventing necrosis; (2) Adequate analgesia, typically IV opioids; (3) Antiemetics for vomiting; (4) NPO initially but early oral feeding (24-72 hours) once pain controlled; (5) Severity assessment using Glasgow, BISAP, or APACHE-II; (6) Avoid prophylactic antibiotics in mild disease; (7) ERCP within 24-72 hours if cholangitis or biliary obstruction; (8) Treat underlying cause — alcohol cessation, manage hypertriglyceridemia.",
                keywords: ["fluid resuscitation", "Ringer's lactate", "analgesia", "early feeding", "severity score", "ERCP"],
            },
        ],

        description: "Heavy drinker with classic pancreatitis presentation — alcohol etiology confirmed on workup.",
        icon: "Droplet",
        color: "bg-yellow-500",
        tags: ["Gastroenterology", "Emergency", "Pancreatitis"],
    },

    /* ── 8 ─ MEDIUM ─ Decompensated Heart Failure ───────────────── */
    {
        case_number: "CASE-011",
        title: "Decompensated Heart Failure",
        specialty: "Cardiology",
        patient_info: "68-year-old female, retired teacher",
        severity: "Medium",
        confidence: 90,
        difficulty_level: "Intermediate",
        estimated_time_minutes: 16,

        chief_complaint: "Progressive dyspnea and leg swelling for 1 week",
        history_of_present_illness:
            "Mrs. Saira, 68F with HFrEF (EF 30%), 1-week history of worsening dyspnea (now at rest), orthopnea (3 pillows), PND, and bilateral leg swelling. 4 kg weight gain. Stopped her diuretic 2 weeks ago.",
        symptoms: ["Dyspnea on exertion", "Orthopnea", "Paroxysmal nocturnal dyspnea", "Leg swelling", "Weight gain"],
        past_medical_history: [
            { condition: "HFrEF (EF 30%)", duration: "3 years", controlled: "partial" },
            { condition: "Hypertension", duration: "20 years", controlled: "good" },
            { condition: "Atrial Fibrillation", duration: "2 years", controlled: "good" },
        ],
        medications: ["Bisoprolol 5 mg OD", "Ramipril 5 mg OD", "Furosemide 40 mg BD (non-compliant)", "Apixaban 5 mg BD"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Never", alcohol: "None", occupation: "Retired teacher", diet: "High salt habits" },
        family_history: "Mother — heart disease.",

        vital_signs: {
            temperature: "36.8 °C",
            heart_rate: "96 bpm, irregular",
            blood_pressure: "146/88 mmHg",
            respiratory_rate: "22 breaths/min",
            oxygen_saturation: "93% on room air",
        },
        general_examination: "Sitting upright, mildly breathless. JVP 8 cm above sternal angle. Bilateral pitting edema to mid-shin.",
        systemic_examination: {
            cardiovascular: "Irregularly irregular pulse. S3 gallop. JVP elevated. Hepatojugular reflux positive.",
            respiratory: "Bilateral fine basal crackles up to mid-zones. Reduced air entry at bases.",
            abdominal: "Soft, mildly distended. Tender hepatomegaly 3 cm.",
            neurological: "Alert, GCS 15/15.",
        },

        laboratory_results: [
            { test: "NT-proBNP", results: { NTproBNP: "4,820 pg/mL (ref <125)" }, interpretation: "Markedly elevated — confirms HF decompensation" },
            { test: "Complete Blood Count", results: { WBC: "8,400/µL", Hemoglobin: "11.8 g/dL" }, interpretation: "Mild anemia" },
            { test: "Renal Function", results: { Creatinine: "1.4 mg/dL (baseline 1.1)", Sodium: "134 mEq/L", Potassium: "4.2 mEq/L" }, interpretation: "Mild AKI on background CKD" },
            { test: "Troponin", results: { troponin: "0.03 ng/mL" }, interpretation: "Excludes acute MI" },
            { test: "ECG", results: { finding: "AF, controlled rate. LVH with strain." }, interpretation: "Chronic changes" },
        ],
        imaging_findings: [
            { test: "Chest X-Ray", findings: "Cardiomegaly. Upper-lobe diversion. Bilateral interstitial edema, Kerley B lines. Small bilateral effusions.", interpretation: "Pulmonary edema, HF" },
            { test: "Echocardiogram", findings: "LV EF 28%. Global hypokinesia. Moderate MR. Dilated LA.", interpretation: "HFrEF, worsening systolic function" },
        ],
        other_investigations: [
            { test: "TSH", results: { TSH: "2.1 mIU/L" }, interpretation: "Normal — excludes thyroid trigger" },
        ],

        differential_diagnosis: [
            { diagnosis: "Decompensated HFrEF (non-compliance)", likelihood: "Very High", reasoning: "Known HF, symptoms classic, BNP markedly elevated, missed diuretic" },
            { diagnosis: "Acute MI with HF", likelihood: "Low", reasoning: "Troponin not significantly elevated" },
            { diagnosis: "Pneumonia", likelihood: "Low", reasoning: "No fever, no focal consolidation" },
            { diagnosis: "PE", likelihood: "Low", reasoning: "No risk factors, bilateral findings" },
        ],
        final_diagnosis: "Acute Decompensated Heart Failure on chronic HFrEF — precipitated by medication non-compliance",
        diagnosis_reasoning: "Classic clinical picture — orthopnea, PND, raised JVP, S3, bilateral crackles, pitting edema. Markedly elevated NT-proBNP and CXR findings of pulmonary edema. Echo confirms worsening systolic function from baseline.",

        management_plan: {
            immediate: ["IV Furosemide 80 mg stat then infusion", "Sit patient upright, supplemental O₂ if SpO₂ <94%", "Consider IV nitrate if BP allows", "Strict fluid balance, daily weights", "Continue beta-blocker if hemodynamically stable"],
            short_term: ["Fluid restriction 1.5 L/day", "Low-salt diet (<2 g/day)", "Optimize GDMT — ACE-I/ARB/ARNI, beta-blocker, MRA, SGLT2i"],
            long_term: ["Cardiac rehabilitation", "Address compliance — pill box, family support", "Consider device therapy (ICD, CRT) if eligible", "Heart failure clinic follow-up"],
        },
        recommendations: [
            "IV loop diuretic is first-line",
            "Don't stop beta-blocker abruptly (taper only if hypotensive)",
            "Address compliance — primary preventable cause of admission",
            "Optimize all four pillars of HFrEF therapy",
        ],
        tests: ["Daily weights and fluid balance", "Repeat BNP for response", "Repeat echo at 3 months on GDMT"],
        prognosis: "5-year mortality 50% in HFrEF. Optimized GDMT and device therapy significantly improves survival. Repeated decompensations worsen prognosis.",

        learning_objectives: [
            "Recognize signs of decompensated heart failure",
            "Interpret BNP/NT-proBNP",
            "Apply 4-pillar guideline-directed medical therapy",
            "Identify and address precipitants",
        ],
        key_teaching_points: [
            "Four pillars of HFrEF: ACE-I/ARB/ARNI, beta-blocker, MRA, SGLT2i",
            "BNP rises with ventricular stretch",
            "Compliance with diet and meds is critical",
            "S3 gallop highly suggests volume overload",
        ],
        clinical_pearls: [
            "Daily weight is the most sensitive home monitoring tool",
            "Diuretic resistance — try combination (loop + thiazide)",
            "SGLT2 inhibitors now first-line regardless of diabetes status",
        ],
        common_pitfalls: [
            "Stopping beta-blockers in decompensation (only if shocked)",
            "Inadequate diuresis leading to readmission",
            "Failing to optimize all 4 GDMT pillars",
        ],
        references: [
            "2022 AHA/ACC/HFSA Guidelines for Heart Failure",
            "2021 ESC HF Guidelines",
        ],

        questions: [
            {
                question: "Which biomarker best confirms acute heart failure?",
                options: ["Troponin", "NT-proBNP", "CRP", "D-dimer"],
                correct: 1,
                explanation: "NT-proBNP (or BNP) rises in response to ventricular stretch — sensitive marker for heart failure.",
            },
            {
                question: "First-line treatment for acute pulmonary edema from HF?",
                options: ["IV beta-blocker", "IV loop diuretic + oxygen + nitrates", "IV adrenaline", "Oral fluid challenge"],
                correct: 1,
                explanation: "Loop diuretics, oxygen, and IV nitrates form the cornerstone of acute pulmonary edema management.",
            },
        ],
        theory_questions: [
            {
                question: "Discuss the four pillars of guideline-directed medical therapy in HFrEF.",
                model_answer: "Modern HFrEF therapy consists of four pillars, each with proven mortality benefit: (1) Renin-Angiotensin-System Inhibitors — ACE inhibitor, ARB, or preferably ARNI (sacubitril/valsartan); (2) Beta-blocker — Bisoprolol, Carvedilol, or Metoprolol succinate; (3) Mineralocorticoid Receptor Antagonist — Spironolactone or Eplerenone; (4) SGLT2 inhibitor — Dapagliflozin or Empagliflozin, regardless of diabetes status. All should be initiated together where tolerated, then up-titrated. Devices (ICD, CRT) considered if EF ≤35% after optimization.",
                keywords: ["ARNI", "beta-blocker", "MRA", "SGLT2", "mortality", "EF 35%"],
            },
        ],

        description: "Known HFrEF presents in decompensation due to medication non-compliance.",
        icon: "Heart",
        color: "bg-pink-500",
        tags: ["Cardiology", "Heart Failure", "Chronic Disease"],
    },

    /* ── 9 ─ LOW ─ Migraine ────────────────────────────────────── */
    {
        case_number: "CASE-012",
        title: "Migraine Without Aura",
        specialty: "Neurology",
        patient_info: "28-year-old female, software engineer",
        severity: "Low",
        confidence: 85,
        difficulty_level: "Beginner",
        estimated_time_minutes: 10,

        chief_complaint: "Recurrent severe left-sided throbbing headache for 6 hours",
        history_of_present_illness:
            "Sara, 28F software engineer, 6-hour severe left-sided pulsating headache, 7/10, worse with movement, with photophobia, phonophobia, and one episode of vomiting. Similar episodes 2-3 monthly for 2 years, often perimenstrual. No fever, no neck stiffness, no neurology.",
        symptoms: ["Unilateral throbbing headache", "Photophobia", "Phonophobia", "Nausea"],
        past_medical_history: [
            { condition: "Episodic Migraine", duration: "2 years", controlled: "partial" },
        ],
        medications: ["Ibuprofen PRN", "Combined oral contraceptive"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Never", alcohol: "Occasional", occupation: "Software engineer", caffeine: "High intake", screen_time: "Heavy" },
        family_history: "Mother and sister with migraine.",

        vital_signs: {
            temperature: "36.7 °C",
            heart_rate: "82 bpm",
            blood_pressure: "118/72 mmHg",
            respiratory_rate: "16 breaths/min",
            oxygen_saturation: "99% on room air",
        },
        general_examination: "Alert, lying in dimmed examination room. No distress other than headache. No rash, no neck stiffness.",
        systemic_examination: {
            neurological: "GCS 15/15. CN intact. No focal deficit. Fundi normal, no papilledema. Kernig/Brudzinski negative.",
            cardiovascular: "Normal heart sounds.",
            respiratory: "Clear.",
            abdominal: "Soft, non-tender.",
        },

        laboratory_results: [
            { test: "Complete Blood Count", results: { WBC: "7,200/µL", Hemoglobin: "13.1 g/dL" }, interpretation: "Normal" },
            { test: "CRP", results: { CRP: "2 mg/L" }, interpretation: "Normal" },
        ],
        imaging_findings: [
            { test: "MRI Brain", findings: "Not indicated — no red flags.", interpretation: "Migraine is clinical diagnosis" },
        ],
        other_investigations: [],

        differential_diagnosis: [
            { diagnosis: "Migraine without aura", likelihood: "Very High", reasoning: "Meets ICHD-3 criteria — recurrent unilateral throbbing with associated symptoms, normal exam" },
            { diagnosis: "Tension headache", likelihood: "Low", reasoning: "Tension headaches are bilateral, pressing/tightening, no nausea/vomiting" },
            { diagnosis: "Cluster headache", likelihood: "Very Low", reasoning: "Cluster is shorter (15-180 min), autonomic features, male predominance" },
            { diagnosis: "Subarachnoid hemorrhage", likelihood: "Very Low", reasoning: "No thunderclap onset, no neck stiffness, no warning" },
        ],
        final_diagnosis: "Migraine Without Aura",
        diagnosis_reasoning: "Recurrent episodes of unilateral throbbing headache lasting 4-72 hours, aggravated by movement, accompanied by nausea, photophobia and phonophobia, in a young woman with positive family history — meets ICHD-3 criteria. Normal exam excludes secondary causes.",

        management_plan: {
            immediate: ["Acute attack: Triptan (Sumatriptan 50-100 mg PO) + NSAID (Ibuprofen 600 mg) + antiemetic (Metoclopramide)", "Quiet, dark, restful environment"],
            short_term: ["Headache diary to identify triggers", "Lifestyle modifications — regular sleep, hydration, reduce caffeine", "Consider stopping COCP (migraine risk factor)"],
            long_term: ["Prophylaxis if >4 attacks/month or disabling: Propranolol, Topiramate, Amitriptyline", "CGRP inhibitors for refractory cases", "Cognitive behavioral therapy"],
        },
        recommendations: [
            "Triptan + NSAID is first-line acute treatment",
            "Avoid COCP in migraine with aura (stroke risk)",
            "Prophylaxis if frequency or impact is significant",
            "Track triggers in a headache diary",
        ],
        tests: ["No imaging indicated unless red flags develop"],
        prognosis: "Excellent. Most episodic migraines respond well to acute treatment. Frequency often decreases with age and trigger avoidance.",

        learning_objectives: [
            "Recognize ICHD-3 criteria for migraine",
            "Differentiate primary from secondary headaches",
            "Identify red flags (SNOOP4)",
            "Plan acute and preventive therapy",
        ],
        key_teaching_points: [
            "Migraine: unilateral, throbbing, 4-72 hours, with nausea/photophobia/phonophobia",
            "Red flags (SNOOP4): Systemic symptoms, Neurological, Onset sudden, Older age, Pattern change, plus 4 more",
            "Triptans contraindicated in CAD, uncontrolled HTN, stroke history",
            "Migraine with aura + COCP increases stroke risk",
        ],
        clinical_pearls: [
            "Combined oral contraceptive should be avoided in migraine with aura",
            "Acute treatment is more effective if taken early in the attack",
            "Medication overuse headache can complicate frequent analgesic use",
        ],
        common_pitfalls: [
            "Missing red flags and overlooking SAH",
            "Overusing acute analgesics causing rebound",
            "Not offering prophylaxis to frequent sufferers",
        ],
        references: [
            "ICHD-3 (International Classification of Headache Disorders)",
            "NICE Headaches in Over 12s Guideline",
        ],

        questions: [
            {
                question: "First-line acute treatment for moderate-severe migraine?",
                options: ["Paracetamol alone", "Triptan ± NSAID", "Opioid", "IV steroid"],
                correct: 1,
                explanation: "Triptans combined with NSAIDs are first-line abortive therapy.",
            },
            {
                question: "Red-flag feature requiring brain imaging?",
                options: ["Unilateral throbbing pain", "Photophobia", "Sudden 'thunderclap' onset", "Mild nausea"],
                correct: 2,
                explanation: "Thunderclap headache raises concern for SAH and mandates urgent imaging.",
            },
        ],
        theory_questions: [
            {
                question: "List the red-flag features (SNOOP4) that warrant urgent investigation in a headache patient.",
                model_answer: "SNOOP4 mnemonic: (S) Systemic symptoms/illness — fever, weight loss, immunocompromise, cancer; (N) Neurological signs/symptoms — confusion, focal deficits, papilledema; (O) Onset — sudden, thunderclap; (O) Older — new headache after age 50; (P) Pattern change — different from usual headaches, progressive; (P) Positional; (P) Precipitated by Valsalva; (P) Pregnancy/Postpartum. Any of these warrants urgent imaging and workup to exclude secondary causes such as SAH, meningitis, tumor, or temporal arteritis.",
                keywords: ["systemic", "neurological", "sudden onset", "older", "pattern change", "thunderclap"],
            },
        ],

        description: "Classic migraine presentation in a young woman — diagnose and counsel on management.",
        icon: "Brain",
        color: "bg-indigo-500",
        tags: ["Neurology", "Primary Care", "Headache"],
    },

    /* ── 10 ─ LOW ─ GERD ───────────────────────────────────────── */
    {
        case_number: "CASE-013",
        title: "Gastroesophageal Reflux Disease",
        specialty: "Gastroenterology",
        patient_info: "38-year-old male, office worker",
        severity: "Low",
        confidence: 85,
        difficulty_level: "Beginner",
        estimated_time_minutes: 10,

        chief_complaint: "Recurrent retrosternal burning for 3 months",
        history_of_present_illness:
            "Mr. Imran, 38M office worker, 3-month retrosternal burning, worse after large meals and lying flat at night. Sour acidic taste in morning. 6 kg weight gain over the year. No dysphagia, weight loss, vomiting, melena, or hematemesis. Partial relief with OTC antacids.",
        symptoms: ["Heartburn", "Acid regurgitation", "Sour taste", "Worse when lying down"],
        past_medical_history: [],
        medications: ["OTC antacids PRN"],
        allergies: ["No known drug allergies"],
        social_history: { smoking: "Never", alcohol: "Social", caffeine: "2-3 cups/day", diet: "Spicy, late dinners", exercise: "Sedentary office work", BMI: "29" },
        family_history: "Non-contributory.",

        vital_signs: {
            temperature: "36.8 °C",
            heart_rate: "76 bpm",
            blood_pressure: "126/80 mmHg",
            respiratory_rate: "16 breaths/min",
            oxygen_saturation: "99% on room air",
        },
        general_examination: "Well-appearing, overweight. No pallor or jaundice.",
        systemic_examination: {
            abdominal: "Soft, mildly tender epigastric. No organomegaly. No mass. Normal bowel sounds.",
            cardiovascular: "Normal S1, S2. No murmurs.",
            respiratory: "Clear.",
            neurological: "Alert.",
        },

        laboratory_results: [
            { test: "Complete Blood Count", results: { WBC: "6,800/µL", Hemoglobin: "14.2 g/dL" }, interpretation: "Normal — no anemia (excludes occult bleed)" },
            { test: "H. pylori Stool Antigen", results: { result: "Negative" }, interpretation: "Active H. pylori excluded" },
        ],
        imaging_findings: [
            { test: "Upper GI Endoscopy", findings: "Not indicated — no alarm features.", interpretation: "Empirical PPI trial appropriate first" },
        ],
        other_investigations: [],

        differential_diagnosis: [
            { diagnosis: "Gastroesophageal Reflux Disease", likelihood: "Very High", reasoning: "Classic symptoms, worse postprandially and recumbent, no alarm features" },
            { diagnosis: "Peptic ulcer disease", likelihood: "Low", reasoning: "H. pylori negative, no epigastric burning that wakes patient" },
            { diagnosis: "Cardiac chest pain (angina)", likelihood: "Very Low", reasoning: "No exertional component, classic GERD pattern" },
            { diagnosis: "Eosinophilic esophagitis", likelihood: "Very Low", reasoning: "No dysphagia or food bolus episodes" },
        ],
        final_diagnosis: "Gastroesophageal Reflux Disease (uninvestigated, no alarm features)",
        diagnosis_reasoning: "Classic symptoms of heartburn and acid regurgitation worsened by recumbency and large meals, partial response to antacids, no alarm features (dysphagia, weight loss, anemia, bleeding) — supports empirical management without urgent endoscopy.",

        management_plan: {
            immediate: ["Empirical PPI trial: Omeprazole 20 mg OD before breakfast × 4-8 weeks", "Lifestyle counseling"],
            short_term: ["Weight loss target: lose 5-7% body weight", "Head-of-bed elevation 15 cm", "Avoid late evening meals (≥3 hours before bed)", "Reduce caffeine, spicy food, smoking"],
            long_term: ["Reassess after PPI trial", "If symptoms recur, step-down therapy", "Endoscopy if alarm features develop or persistent symptoms despite optimization"],
        },
        recommendations: [
            "Lifestyle modification first-line",
            "Empirical PPI trial is appropriate without endoscopy when no alarm features",
            "Endoscopy if alarm features: dysphagia, weight loss, GI bleeding, anemia, age >55 new symptoms",
            "Reassess after PPI trial; consider step-down",
        ],
        tests: ["No further tests unless red flags develop or trial fails"],
        prognosis: "Excellent with lifestyle changes and PPI. Long-term PPI generally safe; ~30% have relapsing course requiring maintenance therapy.",

        learning_objectives: [
            "Recognize typical and atypical GERD symptoms",
            "Identify alarm symptoms requiring endoscopy",
            "Apply step-up and step-down therapy approaches",
            "Counsel on lifestyle measures",
        ],
        key_teaching_points: [
            "Alarm symptoms (ALARMS): Anemia, Loss of weight, Anorexia, Recent onset progressive, Melena/hematemesis, Swallowing difficulty",
            "PPI is more effective than H2 blockers",
            "Lifestyle modification remains crucial",
            "Test for H. pylori in dyspepsia",
        ],
        clinical_pearls: [
            "Take PPI 30-60 minutes before meals for maximum efficacy",
            "Long-term PPI use is associated with low (but real) risks — periodic review",
            "GERD can mimic asthma (cough, wheeze) or laryngitis",
        ],
        common_pitfalls: [
            "Missing alarm symptoms — Barrett's or malignancy",
            "Long-term unmonitored PPI use",
            "Ignoring lifestyle modification",
        ],
        references: [
            "ACG Clinical Guideline: Diagnosis and Management of GERD (2022)",
            "NICE Dyspepsia and GORD Guidelines",
        ],

        questions: [
            {
                question: "Alarm symptom in GERD requiring urgent endoscopy?",
                options: ["Heartburn", "Regurgitation", "Dysphagia or weight loss", "Mild bloating"],
                correct: 2,
                explanation: "Dysphagia, weight loss, GI bleeding, anemia, or persistent vomiting warrant endoscopy to exclude malignancy or stricture.",
            },
            {
                question: "First-line pharmacological treatment for GERD?",
                options: ["H₂ receptor blockers", "Proton pump inhibitors", "Antacids alone", "Prokinetics"],
                correct: 1,
                explanation: "PPIs are the most effective first-line therapy for GERD and erosive esophagitis.",
            },
        ],
        theory_questions: [
            {
                question: "Outline lifestyle modifications recommended for GERD management.",
                model_answer: "Key lifestyle modifications include: (1) Weight loss if overweight — strongly evidence-based; (2) Head-of-bed elevation 15-20 cm using blocks (not just pillows); (3) Avoid lying down within 3 hours of eating; (4) Smaller, more frequent meals; (5) Avoid trigger foods — fatty foods, chocolate, mint, citrus, tomato, spicy food, alcohol, carbonated drinks; (6) Reduce caffeine intake; (7) Smoking cessation; (8) Avoid tight-fitting clothes; (9) Sleep on left side. These measures alone may control mild GERD and improve PPI response.",
                keywords: ["weight loss", "head elevation", "avoid lying after meals", "trigger foods", "smoking", "alcohol"],
            },
        ],

        description: "Middle-aged man with classic GERD — manage with lifestyle and empirical PPI trial.",
        icon: "Activity",
        color: "bg-green-500",
        tags: ["Gastroenterology", "Primary Care", "GERD"],
    },
];

/* ═══════════════════════════════════════════════════════════════════
   INSERTER — matches POST /create endpoint column order exactly
   ═══════════════════════════════════════════════════════════════════ */
async function seed() {
    console.log(`📝 Seeding ${cases.length} practice cases...\n`);

    const insertQuery = `
    INSERT INTO random_cases (
      case_number, title, specialty, patient_info, severity, confidence,
      difficulty_level, estimated_time_minutes,
      chief_complaint, history_of_present_illness, symptoms,
      past_medical_history, medications, allergies, social_history, family_history,
      vital_signs, general_examination, systemic_examination,
      laboratory_results, imaging_findings, other_investigations,
      differential_diagnosis, final_diagnosis, diagnosis_reasoning,
      management_plan, recommendations, tests, prognosis,
      learning_objectives, key_teaching_points, clinical_pearls, common_pitfalls, "references",
      questions, theory_questions,
      description, icon, color, tags
    )
    VALUES (
      $1,  $2,  $3,  $4,  $5,  $6,  $7,  $8,  $9,  $10,
      $11, $12, $13, $14, $15, $16, $17, $18, $19, $20,
      $21, $22, $23, $24, $25, $26, $27, $28, $29, $30,
      $31, $32, $33, $34, $35, $36, $37, $38, $39, $40
    )
    RETURNING id, case_number, title
  `;

    for (const c of cases) {
        try {
            const result = await pool.query(insertQuery, [
                c.case_number, c.title, c.specialty, c.patient_info, c.severity, c.confidence,
                c.difficulty_level, c.estimated_time_minutes,
                c.chief_complaint, c.history_of_present_illness,
                c.symptoms,
                JSON.stringify(c.past_medical_history),
                JSON.stringify(c.medications),
                JSON.stringify(c.allergies),
                JSON.stringify(c.social_history),
                c.family_history,
                JSON.stringify(c.vital_signs),
                c.general_examination,
                JSON.stringify(c.systemic_examination),
                JSON.stringify(c.laboratory_results),
                JSON.stringify(c.imaging_findings),
                JSON.stringify(c.other_investigations || []),
                JSON.stringify(c.differential_diagnosis),
                c.final_diagnosis,
                c.diagnosis_reasoning,
                JSON.stringify(c.management_plan),
                c.recommendations,
                c.tests || [],
                c.prognosis,
                JSON.stringify(c.learning_objectives),
                JSON.stringify(c.key_teaching_points),
                JSON.stringify(c.clinical_pearls),
                JSON.stringify(c.common_pitfalls),
                JSON.stringify(c.references),
                JSON.stringify(c.questions),
                JSON.stringify(c.theory_questions),
                c.description,
                c.icon,
                c.color,
                JSON.stringify(c.tags),
            ]);

            if (result.rows.length > 0) {
                console.log(`  ✅ ${c.case_number} · ${c.title}`);
            } else {
                console.log(`  ⏭️  ${c.case_number} · ${c.title} (already exists, skipped)`);
            }
        } catch (err) {
            console.error(`  ❌ ${c.case_number} · ${c.title}`);
            console.error(`     ${err.message}`);
        }
    }

    console.log("\n✨ Seeding complete.");
    await pool.end();
}

seed().catch((err) => {
    console.error("Fatal error:", err);
    pool.end();
    process.exit(1);
});