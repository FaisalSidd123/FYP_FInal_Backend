const pool = require('./db');

const pneumoniaQuestions = [
  {
    "question": "Describe the typical pathophysiology of Community-Acquired Pneumonia and how it leads to the clinical presentations of crackles and dyspnea.",
    "model_answer": "Community-acquired pneumonia typically involves the inhalation or aspiration of pathogenic organisms into the alveoli. This triggers an inflammatory cascade, resulting in the exudation of fluid, neutrophils, and macrophages into the alveolar spaces (consolidation). The presence of fluid and exudate in the alveoli disrupts normal gas exchange, leading to hypoxemia and dyspnea. Crackles are heard on auscultation as the consolidated airways and fluid-filled alveoli pop open during inspiration.",
    "keywords": ["alveoli", "inflammation", "exudate", "consolidation", "gas exchange", "hypoxemia", "crackles", "fluid"]
  },
  {
    "question": "What is the recommended empirical outpatient treatment for a 68-year-old male with CAP with no major comorbidities, and what is the rationale?",
    "model_answer": "For a previously healthy outpatient with CAP, standard empirical therapy is a macrolide (e.g., azithromycin) or doxycycline. However, since the patient is 68, they may have age-related risks, so considering local resistance rates is important. If the patient had comorbidities or recent antibiotic use, a respiratory fluoroquinolone (e.g., levofloxacin) or a beta-lactam plus a macrolide (e.g., high-dose amoxicillin/clavulanate + azithromycin) would be indicated. The rationale is to cover the most common atypical (Mycoplasma, Chlamydia, Legionella) and typical (Streptococcus pneumoniae) organisms.",
    "keywords": ["macrolide", "doxycycline", "fluoroquinolone", "beta-lactam", "Streptococcus pneumoniae", "atypical", "empirical"]
  }
];

const asthmaQuestions = [
  {
    "question": "A 32-year-old female presents with acute dyspnea, wheezing, and chest tightness. Explain the acute mechanisms causing airway obstruction in this scenario.",
    "model_answer": "The acute airway obstruction in a severe asthma attack is primarily caused by three mechanisms: smooth muscle constriction (bronchospasm) narrowing the airways, airway inflammation leading to mucosal edema, and increased mucus production plugging the smaller airways. These factors combined increase airway resistance, reduce expiratory airflow, and lead to hyperinflation and the characteristic wheezing sound.",
    "keywords": ["bronchospasm", "smooth muscle constriction", "inflammation", "edema", "mucus", "airway resistance"]
  },
  {
    "question": "What should be the immediate pharmacological interventions for treating a severe acute asthma attack in the emergency department?",
    "model_answer": "Immediate pharmacological interventions include inhaled short-acting beta-2 agonists (SABAs) like albuterol, possibly repeated or combined with ipratropium bromide (an anticholinergic) for bronchodilation. Systemic corticosteroids (oral or IV, like prednisone or methylprednisolone) are crucial to reduce airway inflammation. Supplemental oxygen should be provided to maintain O2 saturation above 90-92%. Magnesium sulfate IV could be considered if the patient does not respond adequately to initial therapy.",
    "keywords": ["SABA", "albuterol", "ipratropium", "corticosteroids", "systemic", "oxygen", "bronchodilation"]
  }
];

async function updateCases() {
    try {
        console.log("Updating Community Pneumonia...");
        await pool.query(
            "UPDATE random_cases SET theory_questions = $1::jsonb WHERE title = 'Community Pneumonia'",
            [JSON.stringify(pneumoniaQuestions)]
        );

        console.log("Updating Severe Asthma Attack...");
        await pool.query(
            "UPDATE random_cases SET theory_questions = $1::jsonb WHERE title = 'Severe Asthma Attack'",
            [JSON.stringify(asthmaQuestions)]
        );

        console.log("Success: Theory questions appended to database!");
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

updateCases();
