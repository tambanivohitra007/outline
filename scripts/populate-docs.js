const { Sequelize } = require("sequelize");
const db = new Sequelize("postgres://user:pass@localhost:5432/outline", { logging: false });

const content = {
  // ═══════════════ OBESITY ═══════════════
  "Obesity|risk_factors": `# Obesity — Risk Factors/Causes

## Genetic Factors
- **Family history** — children of obese parents have a 2–3× increased risk
- **FTO gene variants** — associated with increased appetite and reduced satiety
- **Leptin receptor mutations** — rare monogenic forms of severe early-onset obesity
- **Epigenetic modifications** — maternal nutrition during pregnancy affects offspring adiposity

## Dietary Factors
- **Excess caloric intake** — consumption exceeding energy expenditure
- **Ultra-processed foods** — high in refined sugars, unhealthy fats, and additives
- **Sugar-sweetened beverages** — liquid calories bypass satiety mechanisms
- **Large portion sizes** — contribute to passive overconsumption
- **Low fiber intake** — reduced satiety signaling from the gut

## Lifestyle Factors
- **Sedentary behavior** — prolonged sitting, screen time, desk-based work
- **Insufficient sleep** — <7 hours/night disrupts ghrelin/leptin balance
- **Chronic stress** — cortisol promotes visceral fat deposition
- **Shift work** — disruption of circadian rhythms affects metabolism

## Environmental Factors
- **Food deserts** — limited access to affordable, nutritious food
- **Obesogenic environment** — abundant fast food, car-dependent communities
- **Endocrine disruptors** — BPA, phthalates may contribute to metabolic dysfunction
- **Socioeconomic status** — poverty correlates with higher obesity rates

## Medical Causes
- **Hypothyroidism** — reduced metabolic rate
- **Cushing's syndrome** — excess cortisol production
- **Polycystic ovary syndrome (PCOS)** — insulin resistance and weight gain
- **Medications** — corticosteroids, antidepressants (SSRIs, TCAs), antipsychotics, insulin, beta-blockers
`,

  "Obesity|physiology": `# Obesity — Relevant Physiology

## Energy Balance
The fundamental mechanism of obesity involves chronic positive energy balance — caloric intake exceeding expenditure over time. However, the regulation of this balance is extraordinarily complex.

## Adipose Tissue as an Endocrine Organ
- **Leptin** — produced by adipocytes; signals satiety to the hypothalamus. In obesity, leptin resistance develops despite high circulating levels
- **Adiponectin** — anti-inflammatory adipokine; levels *decrease* with increasing adiposity
- **Resistin** — promotes insulin resistance in peripheral tissues
- **TNF-α and IL-6** — pro-inflammatory cytokines secreted by visceral fat, driving chronic low-grade inflammation

## Hypothalamic Regulation
- The **arcuate nucleus** integrates peripheral signals (leptin, ghrelin, insulin) to regulate appetite
- **NPY/AgRP neurons** — stimulate appetite (orexigenic)
- **POMC/CART neurons** — suppress appetite (anorexigenic)
- In obesity, hypothalamic inflammation impairs these feedback loops

## Insulin Resistance Cascade
1. Excess visceral fat → increased free fatty acids (FFAs) in portal circulation
2. FFAs → hepatic insulin resistance → increased gluconeogenesis
3. Compensatory hyperinsulinemia → promotes further lipogenesis
4. Pancreatic β-cell exhaustion → progression to type 2 diabetes

## Gut Microbiome
- Obese individuals show reduced microbial diversity
- Increased **Firmicutes-to-Bacteroidetes ratio** — more efficient energy harvest from food
- Altered short-chain fatty acid (SCFA) production affects gut barrier integrity
- Dysbiosis promotes systemic inflammation via lipopolysaccharide (LPS) translocation

## Metabolic Adaptation
- Weight loss triggers adaptive thermogenesis — reduced resting metabolic rate beyond what body composition changes predict
- This "metabolic adaptation" can persist for years, making weight maintenance challenging
`,

  "Obesity|complications": `# Obesity — Complications

## Cardiovascular
- **Coronary artery disease** — accelerated atherosclerosis
- **Hypertension** — increased blood volume and vascular resistance
- **Heart failure** — eccentric left ventricular hypertrophy
- **Atrial fibrillation** — left atrial enlargement from volume overload
- **Stroke** — both ischemic and hemorrhagic risk increased
- **Deep vein thrombosis / Pulmonary embolism** — hypercoagulable state

## Metabolic
- **Type 2 Diabetes Mellitus** — 80–90% of T2DM patients are overweight/obese
- **Metabolic syndrome** — central obesity + dyslipidemia + hypertension + hyperglycemia
- **Dyslipidemia** — elevated triglycerides, reduced HDL, small dense LDL
- **Non-alcoholic fatty liver disease (NAFLD)** — can progress to NASH and cirrhosis

## Respiratory
- **Obstructive sleep apnea** — pharyngeal fat deposition
- **Obesity hypoventilation syndrome** — restrictive physiology from abdominal mass
- **Asthma** — worsened by systemic inflammation and mechanical factors

## Musculoskeletal
- **Osteoarthritis** — especially weight-bearing joints (knees, hips)
- **Gout** — hyperuricemia from purine metabolism and reduced renal excretion
- **Low back pain** — altered biomechanics and spinal loading

## Cancer
- Increased risk of: breast (postmenopausal), colorectal, endometrial, esophageal, kidney, pancreatic, liver, and gallbladder cancers
- Mechanisms include chronic inflammation, hyperinsulinemia, and elevated estrogen from aromatase activity in adipose tissue

## Psychological
- **Depression and anxiety** — bidirectional relationship
- **Eating disorders** — binge eating disorder in 20–30% of obese individuals seeking treatment
- **Social stigma and discrimination** — impacts quality of life
`,

  "Obesity|solutions": `# Obesity — Solutions

## Lifestyle Interventions (First-Line)

### Nutrition
- **Caloric deficit of 500–750 kcal/day** — targets 0.5–1 kg weight loss per week
- **Plant-based whole foods diet** — high fiber, high nutrient density, low caloric density
- **Mediterranean diet pattern** — proven cardiovascular and metabolic benefits
- **Intermittent fasting** (16:8 or 5:2) — improves insulin sensitivity
- Eliminate sugar-sweetened beverages and ultra-processed foods
- Increase water intake to 2–3 L/day

### Exercise
- **150–300 min/week moderate-intensity aerobic activity** (brisk walking, cycling, swimming)
- **Resistance training** 2–3×/week — preserves lean mass during weight loss
- **NEAT (Non-Exercise Activity Thermogenesis)** — standing desk, walking meetings, active commuting
- Start gradually; any movement is better than none

### Behavioral
- **Cognitive behavioral therapy (CBT)** — addresses emotional eating and maladaptive thought patterns
- **Self-monitoring** — food diaries, daily weigh-ins
- **Stimulus control** — restructure environment to reduce food cues
- **Stress management** — mindfulness, deep breathing, adequate sleep (7–9 hours)

## Hydrotherapy
- **Contrast showers** — alternating hot/cold water stimulates circulation and metabolism
- **Cold water immersion** — activates brown adipose tissue for thermogenesis

## Supplements (Adjunctive)
- **Fiber supplementation** (psyllium, glucomannan) — promotes satiety
- **Chromium picolinate** — may improve insulin sensitivity
- **Green tea extract (EGCG)** — modest effect on fat oxidation
- **Probiotics** — specific strains may support healthy gut microbiome composition

## Medical Interventions
- **GLP-1 receptor agonists** (semaglutide, liraglutide) — 15–20% weight loss
- **Bariatric surgery** — for BMI ≥40 or ≥35 with comorbidities (Roux-en-Y, sleeve gastrectomy)
`,

  "Obesity|bible_sop": `# Obesity — Bible & Spirit of Prophecy

## Biblical Principles

> *"Whether therefore ye eat, or drink, or whatsoever ye do, do all to the glory of God."*
> — 1 Corinthians 10:31 (KJV)

> *"What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own?"*
> — 1 Corinthians 6:19 (KJV)

> *"And put a knife to thy throat, if thou be a man given to appetite."*
> — Proverbs 23:2 (KJV)

> *"And every man that striveth for the mastery is temperate in all things."*
> — 1 Corinthians 9:25 (KJV)

The Bible's original diet in Genesis 1:29 — fruits, grains, nuts, and seeds — represents the ideal nutritional pattern. After the fall, herbs (vegetables) were added (Genesis 3:18).

## Spirit of Prophecy Counsels

> *"Intemperance in eating, even of food of the right quality, will have a prostrating influence upon the system and will blunt the keener and holier emotions."*
> — Ellen G. White, *Counsels on Diet and Foods*, p. 131

> *"The controlling power of appetite will prove the ruin of thousands, when, if they had conquered on this point, they would have had moral power to gain the victory over every other temptation."*
> — Ellen G. White, *Counsels on Diet and Foods*, p. 59

> *"A plain, simple diet, combined with outdoor exercise and fresh air, will do more for the health than all the drugs in the pharmacy."*
> — *Ministry of Healing*, p. 127

### Key SOP Health Principles for Weight Management
- **Two meals a day** may be preferable to three for many adults (*Counsels on Diet and Foods*, p. 173)
- **No eating between meals** — allows the stomach to rest and recover
- **Simple food combinations** — avoid complex mixtures at a single meal
- **Regular exercise in open air** — essential complement to dietary reform
- **Temperance** — self-control in all things, not just avoidance of harmful substances
`,

  "Obesity|research_ideas": `# Obesity — Ideas for Potential Research

## Gut Microbiome Interventions
- **Study**: Randomized controlled trial comparing plant-based diet + targeted probiotics vs. standard dietary counseling for weight loss and metabolic markers over 12 months
- **Hypothesis**: Specific microbiome restoration through diet and probiotics will produce superior and more sustainable weight loss than caloric restriction alone
- **Outcome measures**: Weight, waist circumference, HbA1c, fasting insulin, microbiome diversity (16S rRNA sequencing)

## Circadian Eating Patterns
- **Study**: Cross-over trial of early time-restricted feeding (8am–2pm) vs. conventional eating window (8am–8pm) in obese adults
- **Rationale**: Aligning food intake with circadian rhythm may optimize metabolic processing
- **Outcome measures**: Body composition (DEXA), 24-hour glucose profiles (CGM), sleep quality, appetite hormones

## Hydrotherapy for Brown Fat Activation
- **Study**: Pilot RCT of structured cold water immersion (15°C, 15 min, 3×/week for 12 weeks) vs. thermoneutral bathing
- **Hypothesis**: Regular cold exposure will increase brown adipose tissue activity and resting energy expenditure
- **Outcome measures**: BAT volume (PET-CT), resting metabolic rate (indirect calorimetry), core temperature recovery, body composition

## Lifestyle Medicine vs. GLP-1 Agonists
- **Study**: Head-to-head comparison of intensive lifestyle intervention (NEWSTART program) vs. semaglutide 2.4mg for 52 weeks, with 52-week follow-up after intervention cessation
- **Hypothesis**: Lifestyle changes will show comparable weight loss with better long-term maintenance and fewer side effects
- **Outcome measures**: Weight regain after cessation, cardiovascular risk markers, quality of life, cost-effectiveness

## Digital Health Integration
- **Study**: Evaluate AI-powered dietary coaching app incorporating biblical health principles vs. standard calorie-counting app
- **Outcome measures**: Adherence, weight loss, dietary quality (HEI-2020), spiritual well-being scores
`,

  // ═══════════════ GERD ═══════════════
  "Gastroesophageal Reflux Disease (GERD)|risk_factors": `# GERD — Risk Factors/Causes

## Anatomical Factors
- **Hiatal hernia** — displacement of gastroesophageal junction above the diaphragm, impairing LES function
- **Obesity** — increased intra-abdominal pressure, especially central adiposity
- **Pregnancy** — progesterone relaxes LES + mechanical compression from gravid uterus

## Dietary Triggers
- **Fatty/fried foods** — delay gastric emptying, reduce LES pressure
- **Chocolate** — contains methylxanthines that relax the LES
- **Coffee and caffeine** — stimulate gastric acid secretion
- **Citrus fruits and tomatoes** — direct acid irritation of esophageal mucosa
- **Spicy foods** — capsaicin sensitizes esophageal nociceptors
- **Alcohol** — directly damages esophageal mucosa and reduces LES tone
- **Peppermint** — relaxes the LES
- **Carbonated beverages** — gastric distension triggers transient LES relaxations

## Lifestyle Factors
- **Eating large meals** — gastric distension promotes reflux
- **Eating late at night** — supine position within 2–3 hours of eating
- **Smoking** — reduces LES pressure, impairs esophageal clearance, reduces saliva production
- **Tight-fitting clothing** — increases intra-abdominal pressure

## Medications That Worsen GERD
- NSAIDs, aspirin — direct mucosal irritation
- Calcium channel blockers — reduce LES pressure
- Benzodiazepines — reduce LES pressure
- Theophylline — relaxes LES smooth muscle
- Anticholinergics — delay gastric emptying

## Other Medical Conditions
- **Gastroparesis** — delayed gastric emptying
- **Scleroderma** — esophageal dysmotility and reduced LES pressure
- **Zollinger-Ellison syndrome** — gastric acid hypersecretion
`,

  "Gastroesophageal Reflux Disease (GERD)|physiology": `# GERD — Relevant Physiology

## Normal Anti-Reflux Mechanisms
The gastroesophageal junction (GEJ) maintains a high-pressure zone through:
1. **Lower esophageal sphincter (LES)** — tonically contracted smooth muscle (resting pressure 10–30 mmHg)
2. **Crural diaphragm** — external sphincter that augments LES during inspiration
3. **Angle of His** — acute angle between esophagus and gastric fundus creates a flap valve
4. **Phrenoesophageal ligament** — anchors the GEJ below the diaphragm

## Pathophysiology of GERD

### Transient LES Relaxations (tLESRs)
- The **primary mechanism** in most GERD patients
- Vagally mediated reflex triggered by gastric distension
- Relaxation lasts 10–60 seconds — longer than swallow-induced relaxation
- Accounts for ~70% of reflux events in GERD patients

### Impaired Esophageal Clearance
- **Peristaltic dysfunction** — ineffective esophageal motility fails to clear refluxate
- **Reduced salivary bicarbonate** — impaired chemical neutralization
- **Gravity** — supine position eliminates gravitational clearance

### Gastric Factors
- **Acid pocket** — unbuffered layer of acid that forms on top of meals near the GEJ
- **Delayed gastric emptying** — prolonged gastric distension increases reflux episodes
- **Increased gastric acid production** — less common but contributes in some patients

## Mucosal Defense and Injury
- Esophageal epithelium lacks the protective mucus–bicarbonate barrier of gastric mucosa
- Acid + pepsin → epithelial cell damage → inflammation → erosive esophagitis
- Chronic injury → metaplasia (Barrett's esophagus) → potential dysplasia → adenocarcinoma
- Bile reflux (duodenogastroesophageal reflux) causes additional mucosal damage
`,

  "Gastroesophageal Reflux Disease (GERD)|complications": `# GERD — Complications

## Esophageal Complications
- **Erosive esophagitis** — mucosal breaks visible on endoscopy (Los Angeles grades A–D)
- **Esophageal stricture** — fibrotic narrowing from chronic inflammation; causes dysphagia
- **Barrett's esophagus** — intestinal metaplasia of squamous epithelium; present in ~10% of chronic GERD
- **Esophageal adenocarcinoma** — Barrett's increases risk 30–60× (annual progression rate ~0.5%/year)
- **Esophageal ulceration** — deep mucosal injury with bleeding risk

## Extra-Esophageal Manifestations
- **Chronic cough** — vagally mediated reflex or microaspiration
- **Laryngopharyngeal reflux (LPR)** — hoarseness, throat clearing, globus sensation
- **Dental erosion** — acid dissolves enamel, especially on palatal surfaces of upper teeth
- **Asthma exacerbation** — reflux-triggered bronchospasm via vagal reflex
- **Recurrent aspiration pneumonia** — in severe cases with nocturnal reflux
- **Sinusitis and otitis media** — nasopharyngeal acid exposure

## Quality of Life Impact
- Sleep disturbance from nocturnal reflux
- Dietary restrictions and meal-related anxiety
- Reduced work productivity
- Healthcare utilization and medication costs
`,

  "Gastroesophageal Reflux Disease (GERD)|solutions": `# GERD — Solutions

## Lifestyle Modifications (First-Line)

### Dietary
- **Plant-based, low-acid diet** — emphasize alkaline foods: leafy greens, bananas, melons, oatmeal
- **Small, frequent meals** — avoid gastric distension
- **No eating 3 hours before bedtime** — reduces nocturnal reflux
- Eliminate known triggers: coffee, chocolate, alcohol, fried foods, citrus, tomatoes
- **Chew food thoroughly** — aids digestion and increases saliva (natural bicarbonate)
- Drink water between meals, not during meals

### Positional
- **Elevate head of bed 6–8 inches** (not just extra pillows — elevate the frame)
- **Left lateral decubitus position** — places stomach below esophagus, reduces acid pocket contact
- Avoid bending over or lying down after meals

### Other
- **Weight loss** — even 5–10% body weight reduction significantly improves symptoms
- **Loose-fitting clothing** — avoid waistband pressure on abdomen
- **Smoking cessation** — improves LES function and esophageal clearance
- **Stress management** — visceral hypersensitivity increases with stress

## Hydrotherapy
- **Warm water drinking** upon waking — aids esophageal clearance
- **Abdominal warm compresses** — may help with gastric motility

## Natural Remedies
- **DGL (deglycyrrhizinated licorice)** — mucosal protectant
- **Aloe vera juice** — soothes esophageal inflammation
- **Slippery elm** — demulcent coating for irritated mucosa
- **Ginger tea** — prokinetic effect, improves gastric emptying (avoid in excessive amounts)

## Medical Treatment (When Lifestyle Insufficient)
- **H2 receptor blockers** (famotidine) — for mild/intermittent symptoms
- **Proton pump inhibitors** (omeprazole, pantoprazole) — for erosive disease or frequent symptoms
- **Fundoplication surgery** — for refractory GERD or large hiatal hernia
`,

  "Gastroesophageal Reflux Disease (GERD)|bible_sop": `# GERD — Bible & Spirit of Prophecy

## Biblical Principles

> *"And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat."*
> — Genesis 1:29 (KJV)

> *"Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth."*
> — 3 John 1:2 (KJV)

> *"Be not among winebibbers; among riotous eaters of flesh."*
> — Proverbs 23:20 (KJV)

## Spirit of Prophecy Counsels

> *"Many are made sick by the indulgence of their appetite… The human race have been growing more and more self-indulgent, until health is most successfully sacrificed upon the altar of appetite."*
> — Ellen G. White, *Counsels on Diet and Foods*, p. 147

> *"The stomach, when we lie down to rest, should have its work all done, that it may enjoy rest, as well as other portions of the body. The work of digestion should not be carried on through any period of the sleeping hours."*
> — *Counsels on Diet and Foods*, p. 174

> *"At mealtime cast off care and anxious thought. Do not feel hurried, but eat slowly and with cheerfulness, with your heart filled with gratitude to God."*
> — *Ministry of Healing*, p. 306

### Key Principles Relevant to GERD
- **Regularity of meals** — eat at set times with nothing between meals
- **No late-evening meals** — the stomach needs rest during sleep
- **Simple food combinations** — complex mixtures ferment and produce gas
- **Calm, grateful mealtime atmosphere** — stress impairs digestion
- **Thorough mastication** — chew food until liquid before swallowing
`,

  "Gastroesophageal Reflux Disease (GERD)|research_ideas": `# GERD — Ideas for Potential Research

## Plant-Based Diet as Primary GERD Therapy
- **Study**: Prospective trial of strict plant-based, low-acid diet vs. standard PPI therapy in non-erosive GERD
- **Hypothesis**: Dietary intervention achieves comparable symptom relief to PPIs without medication side effects
- **Outcome measures**: GERD-Q scores, 24-hour pH monitoring, medication use, micronutrient levels

## Meal Timing and Circadian Rhythm
- **Study**: Randomized cross-over comparing two-meal pattern (breakfast + lunch, nothing after 3pm) vs. three-meal pattern in GERD patients
- **Hypothesis**: Earlier cessation of eating will reduce nocturnal reflux events by >50%
- **Outcome measures**: Nocturnal pH impedance, sleep quality (PSQI), symptom scores

## Microbiome Alterations in GERD
- **Study**: Longitudinal characterization of esophageal and gastric microbiome in GERD patients before and after lifestyle intervention
- **Rationale**: Emerging evidence suggests esophageal dysbiosis contributes to reflux esophagitis and Barrett's progression
- **Outcome measures**: Microbial diversity, specific taxa abundance, mucosal inflammation markers

## Stress Reduction and Visceral Hypersensitivity
- **Study**: RCT of mindfulness-based stress reduction (MBSR) + prayer/meditation program as adjunct therapy in functional heartburn
- **Hypothesis**: Central sensitization is a major driver; mind-body interventions can reset pain thresholds
- **Outcome measures**: Symptom frequency, anxiety/depression scores, esophageal sensitivity testing
`,

  // ═══════════════ RHEUMATOID ARTHRITIS ═══════════════
  "Rheumatoid Arthritis|risk_factors": `# Rheumatoid Arthritis — Risk Factors/Causes

## Genetic Factors
- **HLA-DRB1 shared epitope** — strongest genetic risk factor (accounts for ~40% of genetic risk)
- **PTPN22 gene variant** — associated with multiple autoimmune diseases
- First-degree relatives have 3–5× increased risk
- Concordance rate in identical twins: ~15–30%

## Environmental Triggers
- **Smoking** — the strongest modifiable risk factor; increases risk 2–3× and worsens severity
- Smoking + HLA-DRB1 shared epitope = dramatically elevated risk (gene-environment interaction)
- **Silica dust exposure** — occupational hazard in mining, construction
- **Air pollution** — particulate matter may trigger systemic inflammation
- **Infections** — *Porphyromonas gingivalis* (periodontal pathogen) can citrullinate proteins

## Demographic Factors
- **Sex** — women affected 2–3× more than men
- **Age** — peak onset 40–60 years
- **Hormonal** — disease often improves during pregnancy and flares postpartum

## Mucosal Origins Hypothesis
- RA may originate at mucosal surfaces (lungs, gums, gut) before manifesting in joints
- **Intestinal dysbiosis** — altered gut microbiome (increased *Prevotella copri*) found in early RA
- **Periodontal disease** — *P. gingivalis* produces peptidylarginine deiminase (PAD)
- Anti-CCP antibodies can appear years before joint symptoms

## Dietary Factors
- **High red meat consumption** — associated with increased inflammatory markers
- **Western diet** — processed foods, refined carbohydrates, excess omega-6 fatty acids
- **Low vitamin D levels** — associated with increased RA risk and severity
`,

  "Rheumatoid Arthritis|physiology": `# Rheumatoid Arthritis — Relevant Physiology

## Normal Joint Anatomy
- Synovial joints are lined by a thin synovial membrane (1–2 cells thick)
- **Type A synoviocytes** (macrophage-like) — phagocytosis and antigen presentation
- **Type B synoviocytes** (fibroblast-like) — produce synovial fluid, hyaluronic acid, lubricin
- Articular cartilage is avascular and relies on synovial fluid for nutrition

## Autoimmune Initiation
1. **Citrullination** — post-translational modification of arginine → citrulline in proteins
2. In genetically susceptible individuals, citrullinated proteins are presented by HLA-DRB1 to T cells
3. **Loss of immune tolerance** → production of anti-citrullinated protein antibodies (ACPA/anti-CCP)
4. **Rheumatoid factor (RF)** — IgM antibody against the Fc portion of IgG; forms immune complexes

## Synovial Inflammation (Synovitis)
- Activated CD4+ T cells infiltrate the synovium → activate macrophages and B cells
- **Cytokine cascade**: TNF-α, IL-1, IL-6, IL-17 drive chronic inflammation
- Synovial membrane hypertrophy — from 1–2 cells to 8–10 cells thick
- **Pannus formation** — aggressive, invasive granulation tissue at the cartilage-bone junction

## Joint Destruction
- **Cartilage degradation** — matrix metalloproteinases (MMPs) and aggrecanases destroy cartilage matrix
- **Bone erosion** — osteoclasts activated by RANKL
- **Osteopenia** — peri-articular bone loss from local inflammation + systemic effects
- Tendon and ligament damage → joint instability and deformity

## Systemic Effects
- Cardiovascular — accelerated atherosclerosis (leading cause of mortality in RA)
- Pulmonary — interstitial lung disease, pleural effusions
- Hematologic — anemia of chronic disease, Felty syndrome
- Neurologic — cervical myelopathy from atlantoaxial subluxation
`,

  "Rheumatoid Arthritis|complications": `# Rheumatoid Arthritis — Complications

## Joint Complications
- **Joint destruction and deformity** — swan neck, boutonnière, ulnar deviation of MCP joints
- **Atlantoaxial subluxation** — cervical instability with risk of spinal cord compression
- **Carpal tunnel syndrome** — from synovial swelling at the wrist
- **Baker's cyst** — popliteal synovial cyst that may rupture (mimics DVT)
- **Joint contractures** — fixed flexion deformities limiting function

## Cardiovascular (Leading Cause of Death in RA)
- **Accelerated atherosclerosis** — 1.5–2× increased cardiovascular mortality
- **Pericarditis** — usually subclinical
- **Myocarditis** — rare but documented

## Pulmonary
- **Interstitial lung disease (ILD)** — especially usual interstitial pneumonia (UIP) pattern
- **Rheumatoid nodules** in lung parenchyma
- **Pleural effusions** — exudative, with very low glucose
- **Bronchiectasis** — from chronic airway inflammation

## Hematologic
- **Anemia of chronic disease** — most common extra-articular manifestation
- **Felty syndrome** — RA + splenomegaly + neutropenia → infection risk

## Other
- **Osteoporosis** — from inflammation + corticosteroid use + reduced mobility
- **Vasculitis** — rheumatoid vasculitis affecting skin, nerves, organs
- **Depression** — affects 30–40% of RA patients
- **Increased infection risk** — from disease itself and immunosuppressive medications
`,

  "Rheumatoid Arthritis|solutions": `# Rheumatoid Arthritis — Solutions

## Anti-Inflammatory Diet
- **Plant-based, whole foods diet** — reduces inflammatory burden
- **Anti-inflammatory foods**: turmeric (curcumin), ginger, omega-3 rich foods (flaxseed, walnuts, chia seeds)
- **Mediterranean diet** — associated with reduced RA disease activity
- **Eliminate**: processed foods, refined sugar, excess omega-6 (vegetable oils), alcohol
- **Elimination diet** — identify personal trigger foods (common: gluten, dairy, nightshades)

## Exercise
- **Low-impact aerobic exercise** — swimming, cycling, walking (30 min, 5×/week)
- **Range-of-motion exercises** — daily to maintain joint flexibility
- **Strengthening exercises** — isometric and isotonic to stabilize joints
- **Yoga and tai chi** — improve flexibility, balance, and reduce pain perception

## Hydrotherapy
- **Warm water therapy** (33–36°C) — reduces pain, stiffness, and improves joint mobility
- **Contrast baths** — alternating warm and cool water for hands and feet
- **Paraffin wax baths** — for hand stiffness and pain
- **Aquatic exercise** — buoyancy reduces joint loading while allowing movement

## Stress Management
- **Mindfulness meditation** — reduces perceived pain and disease-related stress
- **Deep breathing exercises** — activates parasympathetic nervous system
- **Adequate sleep** (7–9 hours) — poor sleep worsens pain sensitivity and inflammation

## Supplements
- **Omega-3 fatty acids** (EPA/DHA from algae or fish oil) — 2–3g/day reduces joint inflammation
- **Vitamin D** — maintain levels >40 ng/mL
- **Probiotics** — specific strains may modulate gut-mediated immune response
- **Curcumin** (with piperine for absorption) — anti-inflammatory comparable to NSAIDs in some studies

## Medical Treatment
- **DMARDs** — methotrexate (first-line), hydroxychloroquine, sulfasalazine
- **Biologics** — TNF inhibitors, IL-6 inhibitors, B-cell depletion, JAK inhibitors
- **Corticosteroids** — short-term bridge therapy during flares
`,

  "Rheumatoid Arthritis|bible_sop": `# Rheumatoid Arthritis — Bible & Spirit of Prophecy

## Biblical Principles

> *"Is any sick among you? let him call for the elders of the church; and let them pray over him, anointing him with oil in the name of the Lord."*
> — James 5:14 (KJV)

> *"He healeth the broken in heart, and bindeth up their wounds."*
> — Psalm 147:3 (KJV)

> *"But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint."*
> — Isaiah 40:31 (KJV)

## Spirit of Prophecy Counsels

> *"Pure air, sunlight, abstemiousness, rest, exercise, proper diet, the use of water, trust in divine power — these are the true remedies."*
> — Ellen G. White, *Ministry of Healing*, p. 127

> *"Disease never comes without a cause. The way is prepared, and disease invited, by disregarding the laws of health."*
> — *Ministry of Healing*, p. 234

### Relevant Principles
- **Trust in God** — faith reduces anxiety and stress, which are known RA triggers
- **Natural remedies** — water therapy, sunlight (vitamin D), fresh air, rest, and exercise
- **Plant-based diet** — aligns with both scriptural principles and anti-inflammatory evidence
- **Temperance** — avoiding substances that increase inflammation
`,

  "Rheumatoid Arthritis|research_ideas": `# Rheumatoid Arthritis — Ideas for Potential Research

## Gut Microbiome Restoration
- **Study**: RCT of plant-based diet + targeted pre/probiotics vs. standard diet in early RA
- **Hypothesis**: Correcting intestinal dysbiosis will reduce disease activity and delay need for immunosuppressive therapy
- **Outcome measures**: DAS28-CRP, anti-CCP levels, gut microbiome composition, intestinal permeability

## Hydrotherapy Protocol Standardization
- **Study**: Multi-center RCT comparing structured warm water therapy (3×/week, 12 weeks) vs. land-based exercise vs. combination
- **Outcome measures**: HAQ-DI (disability index), grip strength, 6-minute walk test, patient-reported pain

## Vitamin D Supplementation
- **Study**: Double-blind RCT of high-dose vitamin D3 (4000 IU/day) vs. placebo as adjunct to DMARD therapy
- **Hypothesis**: Vitamin D repletion will reduce flare frequency and DMARD dose requirements
- **Outcome measures**: Flare rate, DAS28, DMARD dose adjustments, Treg/Th17 cell ratio

## Periodontal Treatment and RA
- **Study**: RCT of aggressive periodontal treatment in anti-CCP positive individuals without clinical RA
- **Hypothesis**: Eliminating the mucosal source of citrullinated proteins will reduce anti-CCP levels
- **Outcome measures**: Anti-CCP titer trajectory, clinical RA development rate
`,

  // ═══════════════ COPD ═══════════════
  "Chronic Obstructive Pulmonary Disease (COPD)|risk_factors": `# COPD — Risk Factors/Causes

## Primary Risk Factor
- **Tobacco smoking** — accounts for ~80% of COPD cases in developed countries
- Risk is dose-dependent (pack-years): >20 pack-years significantly increases risk
- Passive (secondhand) smoke exposure also increases risk

## Other Inhalational Exposures
- **Biomass fuel smoke** — major cause in developing countries
- **Occupational dusts and chemicals** — coal, silica, cadmium, grain dust, isocyanates
- **Air pollution** — particulate matter (PM2.5, PM10), nitrogen dioxide, ozone

## Genetic Factors
- **Alpha-1 antitrypsin (AAT) deficiency** — accounts for 1–2% of COPD
- **SERPINA1 gene (PiZZ genotype)** — AAT levels <50 mg/dL

## Developmental Factors
- **Childhood respiratory infections** — severe pneumonia reduces maximum attained lung function
- **Low birth weight / prematurity** — reduced lung development
- **Childhood asthma** — may reduce lung growth trajectory
- **Maternal smoking during pregnancy** — impairs fetal lung development

## Host Factors
- **Age** — natural decline in FEV1 accelerates after age 35
- **Female sex** — women may be more susceptible to tobacco smoke per pack-year
- **HIV infection** — accelerates emphysema development
`,

  "Chronic Obstructive Pulmonary Disease (COPD)|physiology": `# COPD — Relevant Physiology

## Normal Lung Physiology
- **FEV1** normally declines ~25–30 mL/year after age 35
- Elastic recoil of lung parenchyma drives passive expiration
- Protease–antiprotease balance maintains alveolar structure
- Mucociliary clearance removes inhaled particles and pathogens

## Two Main Phenotypes

### Chronic Bronchitis ("Blue Bloater")
- Productive cough for ≥3 months in ≥2 consecutive years
- Mucous gland hypertrophy and hyperplasia in large airways; goblet cell metaplasia in small airways
- Mucus plugging → airflow obstruction → V/Q mismatch → hypoxemia and hypercapnia

### Emphysema ("Pink Puffer")
- Destruction of alveolar walls distal to terminal bronchioles
- **Centriacinar** — upper lobes, smoking-related
- **Panacinar** — lower lobes, AAT deficiency
- Loss of elastic recoil → air trapping → hyperinflation → flattened diaphragm

## Key Pathogenic Mechanisms

### Protease–Antiprotease Imbalance
- Cigarette smoke activates alveolar macrophages and recruits neutrophils
- Neutrophils release **elastase, MMP-9, MMP-12** → destroy elastin and collagen
- Oxidants from smoke inactivate **alpha-1 antitrypsin**
- Net result: unopposed proteolytic destruction of alveolar walls

### Oxidative Stress
- Cigarette smoke contains >4,700 chemicals including reactive oxygen species
- Overwhelms antioxidant defenses (glutathione, superoxide dismutase)
- Amplifies inflammation, inactivates antiproteases, induces mucus secretion

### Small Airway Disease
- Inflammation and fibrosis of airways <2mm diameter
- This is the earliest and most important site of airflow obstruction

## Systemic Effects
- Skeletal muscle wasting, cardiovascular effects, osteoporosis, depression
`,

  "Chronic Obstructive Pulmonary Disease (COPD)|complications": `# COPD — Complications

## Acute Exacerbations (AECOPD)
- Acute worsening of respiratory symptoms beyond normal day-to-day variation
- **Triggers**: viral infections (~50%), bacterial infections (~30%), air pollution, cold air
- Each exacerbation accelerates lung function decline
- Frequent exacerbations (≥2/year) define the "frequent exacerbator" phenotype

## Respiratory Failure
- **Type 2 (hypercapnic)** respiratory failure — PaCO2 >45 mmHg, PaO2 <60 mmHg
- **Caution**: uncontrolled O2 can suppress hypoxic drive → worsening hypercapnia

## Pulmonary Hypertension and Cor Pulmonale
- Chronic hypoxemia → hypoxic pulmonary vasoconstriction → pulmonary arterial remodeling
- Increased right ventricular afterload → right heart failure

## Pneumothorax
- Rupture of subpleural bullae → spontaneous pneumothorax
- Can be life-threatening in patients with limited respiratory reserve

## Lung Cancer
- COPD is an independent risk factor for lung cancer (beyond shared smoking exposure)

## Other Complications
- **Cachexia and muscle wasting** — affects ~25% of COPD patients
- **Osteoporosis** — from systemic inflammation, corticosteroids, reduced activity
- **Depression and anxiety** — prevalent in 40–60%
- **Polycythemia** — compensatory response to chronic hypoxemia
`,

  "Chronic Obstructive Pulmonary Disease (COPD)|solutions": `# COPD — Solutions

## Smoking Cessation (Most Important Intervention)
- **The single most effective intervention** to slow disease progression at any stage
- Combination therapy: behavioral counseling + pharmacotherapy
- Reduces annual FEV1 decline from ~60 mL/year toward the normal ~30 mL/year

## Exercise and Pulmonary Rehabilitation
- **Pulmonary rehabilitation** — supervised exercise training + education + behavioral change
- **Aerobic training** — walking, cycling; improves exercise capacity and reduces dyspnea
- **Resistance training** — combats skeletal muscle wasting
- **Breathing techniques** — pursed-lip breathing, diaphragmatic breathing

## Nutrition
- **Plant-based, antioxidant-rich diet** — fruits and vegetables provide vitamins C and E, carotenoids
- **Adequate protein intake** — 1.2–1.5 g/kg/day to prevent muscle wasting
- **Omega-3 fatty acids** — anti-inflammatory
- Avoid large meals that impair diaphragm function
- Maintain healthy BMI

## Air Quality
- **Fresh, clean air** — avoid indoor and outdoor pollutants
- Use HEPA filters indoors
- Monitor air quality index (AQI)

## Hydrotherapy
- **Steam inhalation** — warm, humidified air helps loosen mucus
- **Adequate hydration** — 2–3 L/day to keep mucus thin

## Sunlight and Rest
- **Sunlight exposure** — vitamin D synthesis; deficiency worsens exacerbations
- **Adequate sleep** — treat sleep-disordered breathing
- **Paced activity** — energy conservation techniques

## Medical Management
- **Bronchodilators** — LABAs, LAMAs, SABA rescue
- **Inhaled corticosteroids** — for frequent exacerbators
- **Supplemental oxygen** — for resting PaO2 ≤55 mmHg
- **Vaccinations** — influenza, pneumococcal, COVID-19
`,

  "Chronic Obstructive Pulmonary Disease (COPD)|bible_sop": `# COPD — Bible & Spirit of Prophecy

## Biblical Principles

> *"And the LORD God formed man of the dust of the ground, and breathed into his nostrils the breath of life; and man became a living soul."*
> — Genesis 2:7 (KJV)

> *"Let every thing that hath breath praise the LORD."*
> — Psalm 150:6 (KJV)

> *"The Spirit of God hath made me, and the breath of the Almighty hath given me life."*
> — Job 33:4 (KJV)

## Spirit of Prophecy Counsels

> *"In order to be in health, nothing is more needed than pure, fresh air."*
> — *Counsels on Health*, p. 58

> *"The lungs should be allowed the greatest freedom possible. Their capacity is developed by free action; it diminishes if they are cramped and compressed."*
> — *Ministry of Healing*, p. 272

> *"Tobacco is a slow, insidious, but most malignant poison."*
> — *Ministry of Healing*, p. 327

### Key Principles for COPD
- **Pure air** — essential remedy; keep rooms well-ventilated
- **Tobacco cessation** — no compromise; it destroys the temple of God
- **Deep breathing and exercise in open air** — expand lung capacity
- **Trust in God** — reduces anxiety associated with breathlessness
`,

  "Chronic Obstructive Pulmonary Disease (COPD)|research_ideas": `# COPD — Ideas for Potential Research

## Antioxidant-Rich Diet and FEV1 Decline
- **Study**: Prospective cohort comparing high antioxidant intake (plant-based diet) vs. standard Western diet in current/former smokers with early COPD
- **Hypothesis**: Dietary antioxidants will slow annual FEV1 decline
- **Outcome measures**: Annual FEV1 change, exacerbation rate, serum antioxidant levels

## Structured Breathing Exercise Program
- **Study**: RCT of daily structured breathing exercises delivered via mobile app vs. standard care
- **Outcome measures**: Maximal inspiratory pressure, dyspnea scores, COPD Assessment Test

## Vitamin D and Exacerbation Prevention
- **Study**: Double-blind RCT of vitamin D3 supplementation (4000 IU/day) in COPD patients with baseline 25(OH)D <20 ng/mL
- **Hypothesis**: Correcting vitamin D deficiency will reduce exacerbation frequency by ≥30%
- **Outcome measures**: Exacerbation rate, time to first exacerbation, FEV1

## Fresh Air Therapy
- **Study**: Comparative study of rural clean-air rehabilitation vs. urban-based pulmonary rehabilitation
- **Outcome measures**: Exacerbation rate, exercise tolerance, inflammatory biomarkers
`,

  // ═══════════════ CAD ═══════════════
  "Coronary Artery Disease (CAD)|risk_factors": `# Coronary Artery Disease — Risk Factors/Causes

## Non-Modifiable Risk Factors
- **Age** — men ≥45, women ≥55
- **Sex** — men at higher risk until women reach menopause
- **Family history** — first-degree relative with premature CAD
- **Genetics** — 9p21 locus, LPA gene variants, familial hypercholesterolemia

## Major Modifiable Risk Factors
- **Dyslipidemia** — elevated LDL-C, low HDL-C, elevated triglycerides
- **Hypertension** — chronic elevated BP damages endothelium
- **Diabetes mellitus** — 2–4× increased CAD risk
- **Tobacco smoking** — endothelial damage, pro-thrombotic state, lipid oxidation
- **Obesity** — especially visceral/central adiposity
- **Physical inactivity** — sedentary lifestyle doubles CAD risk

## Emerging/Contributing Risk Factors
- **Chronic inflammation** — elevated hs-CRP; inflammatory conditions (RA, lupus) increase risk
- **Chronic stress and depression** — sustained cortisol elevation
- **Sleep disorders** — obstructive sleep apnea increases CAD risk
- **Chronic kidney disease** — accelerated vascular calcification
- **Periodontal disease** — chronic inflammation and bacteremia

## Dietary Risk Factors
- **High saturated and trans fat intake** — raises LDL cholesterol
- **High sodium intake** — contributes to hypertension
- **Low fruit and vegetable consumption** — reduced antioxidant and fiber intake
- **Excess refined carbohydrates and sugar** — insulin resistance, dyslipidemia
`,

  "Coronary Artery Disease (CAD)|physiology": `# Coronary Artery Disease — Relevant Physiology

## Normal Coronary Circulation
- The heart receives blood through the **left main** (→ LAD + LCx) and **right coronary artery (RCA)**
- Coronary blood flow occurs primarily during **diastole**
- Myocardial oxygen extraction is near-maximal at rest (~75%); increased demand can only be met by increased flow

## Atherosclerosis: The Pathogenic Process

### Stage 1 — Endothelial Dysfunction
- Risk factors injure the endothelial lining
- Injured endothelium becomes permeable to LDL particles
- Reduced nitric oxide (NO) production → impaired vasodilation

### Stage 2 — Fatty Streak Formation
- LDL particles cross into the subendothelial space and become **oxidized (ox-LDL)**
- Macrophages engulf ox-LDL via scavenger receptors → become **foam cells**
- Foam cell accumulation = fatty streak

### Stage 3 — Fibrous Plaque Development
- Smooth muscle cells migrate from media to intima
- **Fibrous cap** forms over the lipid-rich necrotic core
- Stable plaque → gradual lumen narrowing → exertional angina

### Stage 4 — Plaque Complications
- **Vulnerable plaque** = thin fibrous cap (<65 μm), large lipid core, intense inflammation
- Plaque rupture → thrombus formation → **Acute coronary syndrome**

## Collateral Circulation
- Chronic ischemia stimulates angiogenesis
- Exercise promotes collateral development
`,

  "Coronary Artery Disease (CAD)|complications": `# Coronary Artery Disease — Complications

## Acute Coronary Syndromes (ACS)
- **Unstable angina** — rest angina or crescendo pattern; no biomarker elevation
- **NSTEMI** — subendocardial infarction; elevated troponin without ST elevation
- **STEMI** — transmural infarction; ST elevation; complete coronary occlusion

## Heart Failure
- **Systolic dysfunction** — reduced ejection fraction from loss of contractile myocardium
- **Ischemic cardiomyopathy** — progressive ventricular remodeling
- **Hibernating myocardium** — chronically ischemic but viable; may recover with revascularization

## Arrhythmias
- **Ventricular tachycardia/fibrillation** — leading cause of sudden cardiac death
- **Atrial fibrillation** — from atrial ischemia or stretch
- **Heart block** — especially with RCA occlusion

## Mechanical Complications of MI
- **Papillary muscle rupture** — severe acute mitral regurgitation
- **Ventricular septal rupture** — hemodynamic compromise
- **Free wall rupture** — cardiac tamponade, usually fatal
- **Pericarditis** — early or late (Dressler syndrome)

## Chronic Complications
- **Chronic stable angina** — predictable exertional chest pain
- **Peripheral artery disease** — systemic atherosclerosis
- **Cerebrovascular disease** — increased stroke risk
`,

  "Coronary Artery Disease (CAD)|solutions": `# Coronary Artery Disease — Solutions

## Nutrition (Most Powerful Lifestyle Intervention for CAD)
- **Plant-based, whole foods diet** — Ornish and Esselstyn programs have demonstrated angiographic regression
- **Eliminate/minimize**: saturated fat, trans fat, cholesterol, refined sugar, processed foods
- **Emphasize**: vegetables, fruits, whole grains, legumes, nuts, seeds
- **DASH diet** — for blood pressure reduction
- **Oats and barley** — beta-glucan fiber lowers LDL cholesterol

## Exercise
- **150–300 min/week moderate-intensity aerobic exercise**
- **Cardiac rehabilitation** — reduces mortality by 20–25% after ACS
- Exercise promotes collateral vessel development, improves endothelial function, raises HDL

## Stress Management
- **Mindfulness-based stress reduction (MBSR)** — proven cardiovascular benefit
- **Social support and community** — strong social connections reduce CAD mortality
- **Nature exposure** — reduces cortisol, blood pressure, and heart rate

## Hydrotherapy
- **Warm baths** (38–40°C) — reduce blood pressure, improve vascular function
- **Sauna therapy** — associated with reduced cardiovascular mortality
- **Contrast showers** — improve endothelial function

## Sunlight
- **Vitamin D** — deficiency associated with increased cardiovascular risk
- **Nitric oxide release** — UV exposure triggers NO release from skin stores

## Supplements
- **Omega-3 fatty acids** — 2–4g/day reduces triglycerides
- **Coenzyme Q10** — antioxidant; may benefit heart failure patients
- **Magnesium** — vasodilator; deficiency common
- **Plant sterols/stanols** — 2g/day lowers LDL by ~10%

## Medical/Surgical
- **Antiplatelet therapy** — aspirin, P2Y12 inhibitors
- **Statins** — cornerstone of LDL lowering
- **ACE inhibitors / ARBs** — vascular protection
- **PCI with stenting** — for acute MI or refractory angina
- **CABG surgery** — for left main or multi-vessel disease
`,

  "Coronary Artery Disease (CAD)|bible_sop": `# Coronary Artery Disease — Bible & Spirit of Prophecy

## Biblical Principles

> *"A merry heart doeth good like a medicine: but a broken spirit drieth the bones."*
> — Proverbs 17:22 (KJV)

> *"Keep thy heart with all diligence; for out of it are the issues of life."*
> — Proverbs 4:23 (KJV)

> *"Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid."*
> — John 14:27 (KJV)

## Spirit of Prophecy Counsels

> *"Grains, fruits, nuts, and vegetables constitute the diet chosen for us by our Creator. These foods, prepared in as simple and natural a manner as possible, are the most healthful and nourishing."*
> — *Ministry of Healing*, p. 296

> *"The heart and the brain are the organs most directly affected by impure, unwholesome food."*
> — *Counsels on Health*, p. 134

### Key Principles
- **Plant-based diet** — the original Eden diet protects the heart
- **Peace and trust in God** — eliminates chronic stress, a major CAD risk factor
- **Temperance in all things** — moderation even in good foods
- **Cheerfulness and gratitude** — "a merry heart" is literally cardiac medicine
`,

  "Coronary Artery Disease (CAD)|research_ideas": `# Coronary Artery Disease — Ideas for Potential Research

## Plant-Based Diet and Coronary Plaque Regression
- **Study**: Prospective trial using coronary CT angiography to measure plaque volume change after 24 months of strict plant-based diet vs. AHA-recommended diet
- **Hypothesis**: Plant-based diet will achieve greater plaque regression
- **Outcome measures**: Coronary plaque volume, LDL-C, hs-CRP, endothelial function

## Sauna Therapy and Cardiovascular Outcomes
- **Study**: RCT of regular Finnish-style sauna (4×/week) vs. control in stable CAD patients
- **Outcome measures**: Endothelial function, blood pressure, arterial stiffness, cardiac events at 2 years

## Comprehensive Lifestyle Intervention (NEWSTART)
- **Study**: Replication of Ornish Lifestyle Heart Trial using the NEWSTART framework
- **Hypothesis**: Adding spiritual/mental health components will improve both cardiac outcomes and adherence
- **Outcome measures**: Coronary angiographic change, MACE, quality of life, program adherence at 5 years

## Morning Sunlight and Blood Pressure
- **Study**: RCT of structured morning sunlight exposure (30 min/day) vs. indoor light control
- **Hypothesis**: UV-mediated nitric oxide release will reduce daytime ambulatory blood pressure
- **Outcome measures**: 24-hour ambulatory BP, serum NO metabolites, vitamin D levels
`,

  // ═══════════════ MIGRAINES ═══════════════
  "Migraines|risk_factors": `# Migraines — Risk Factors/Causes

## Genetic Factors
- **Strong hereditary component** — 50–60% of migraine risk is genetic
- First-degree relatives of migraineurs have 2–4× increased risk
- **Familial hemiplegic migraine** — mutations in CACNA1A, ATP1A2, SCN1A

## Triggers

### Dietary Triggers
- **Tyramine-containing foods** — aged cheese, red wine, fermented foods, processed meats
- **Nitrates/nitrites** — cured meats
- **MSG** — processed snacks
- **Artificial sweeteners** — aspartame, sucralose
- **Alcohol** — especially red wine
- **Caffeine** — both excess intake and withdrawal
- **Chocolate** — contains phenylethylamine and caffeine
- **Dehydration** — insufficient water intake

### Environmental Triggers
- **Weather changes** — barometric pressure drops, temperature changes
- **Strong sensory stimuli** — bright/flickering lights, loud noises, strong odors
- **Altitude changes** — air travel, mountain ascent

### Hormonal Factors
- **Menstruation** — estrogen withdrawal triggers menstrual migraine in ~60% of female migraineurs
- **Oral contraceptives** — may worsen or improve migraines
- **Pregnancy** — often improves (stable high estrogen)

### Lifestyle Triggers
- **Stress** — the #1 reported trigger
- **Sleep disturbance** — too little, too much, or irregular patterns
- **Skipping meals** — hypoglycemia
- **Screen time** — prolonged computer/phone use, blue light exposure
`,

  "Migraines|physiology": `# Migraines — Relevant Physiology

## Current Understanding: Neurovascular Theory
Migraine is a **complex neurovascular disorder** — primarily a brain disorder with secondary vascular involvement.

## The Migraine Cascade

### Phase 1 — Premonitory (Prodrome)
- Hours to days before headache
- **Hypothalamic activation** — yawning, food cravings, mood changes, neck stiffness
- Dopaminergic and serotonergic dysregulation

### Phase 2 — Aura (in ~25% of migraineurs)
- **Cortical spreading depression (CSD)** — wave of neuronal depolarization followed by suppression
- Propagates across cortex at 2–6 mm/min
- CSD activates trigeminal afferents → links aura to headache

### Phase 3 — Headache
- **Trigeminovascular system activation**:
  1. Trigeminal nerve fibers release neuropeptides
  2. **CGRP** — key mediator; causes vasodilation, neurogenic inflammation
  3. Meningeal inflammation → sensitization → throbbing pain
- **Peripheral sensitization** → pain worsened by coughing, bending
- **Central sensitization** → cutaneous allodynia

### Phase 4 — Postdrome
- Hours to days after headache resolves
- Fatigue, cognitive difficulty ("migraine hangover")

## Serotonin's Role
- Brain serotonin levels drop during attacks
- Triptans work as 5-HT1B/1D receptor agonists

## CGRP: The Key Target
- CGRP is massively released during migraine attacks
- Anti-CGRP therapies represent the first migraine-specific preventive medications
`,

  "Migraines|complications": `# Migraines — Complications

## Chronic Migraine
- ≥15 headache days/month for ≥3 months, with migraine features on ≥8 days
- ~3% of episodic migraineurs progress to chronic annually
- **Risk factors**: medication overuse, obesity, depression, high attack frequency

## Medication Overuse Headache (MOH)
- Using acute medications ≥10–15 days/month → paradoxical worsening
- Treatment requires withdrawal of the overused medication

## Migraine-Related Stroke
- **Migrainous infarction** — ischemic stroke occurring during a migraine with aura
- Migraine with aura increases ischemic stroke risk ~2×
- Risk amplified by: oral contraceptives + smoking + migraine with aura

## Status Migrainosus
- Debilitating migraine lasting >72 hours despite treatment
- Risk of dehydration from nausea/vomiting

## Mental Health Impact
- **Depression** — 2–4× more common in migraineurs
- **Anxiety disorders** — prevalence 2–5× higher
- **Reduced quality of life** — WHO ranks migraine as the 2nd most disabling neurological condition

## Other
- **Sleep disorders** — bidirectional relationship with migraine
- **Cardiovascular risk** — migraine with aura associated with increased MI risk
`,

  "Migraines|solutions": `# Migraines — Solutions

## Trigger Identification and Avoidance
- **Keep a headache diary** — track food, sleep, stress, weather, menstrual cycle
- **Regular routines** — consistent sleep, meal times, hydration

## Nutrition
- **Elimination diet** — identify and remove personal food triggers
- **Anti-inflammatory, plant-based diet** — rich in magnesium, riboflavin, omega-3
- **Regular meals** — never skip; maintain stable blood glucose
- **Hydration** — minimum 2–3 L water/day
- **Magnesium-rich foods** — spinach, pumpkin seeds, dark chocolate, avocado, almonds

## Exercise
- **Regular moderate aerobic exercise** — 30–40 min, 3–5×/week
- **Yoga** — RCTs show reduction in migraine frequency comparable to medication

## Hydrotherapy
- **Cold compress/ice pack** on forehead or neck during acute attack
- **Warm foot bath** during attack — redirects blood flow away from the head
- **Contrast therapy** — cold head + warm feet

## Rest and Sleep
- **7–8 hours of regular sleep** — both too little and too much can trigger attacks
- **Consistent sleep/wake times** — even on weekends
- **Avoid screens 1 hour before bed**

## Stress Management
- **Progressive muscle relaxation** — proven migraine preventive (evidence level A)
- **Biofeedback** — thermal biofeedback has strong evidence
- **Mindfulness meditation** — reduces attack frequency and pain intensity

## Supplements (Evidence-Based Preventives)
- **Magnesium** (400–600 mg/day) — Level B evidence for prevention
- **Riboflavin (B2)** (400 mg/day) — reduces frequency by ~50% in responders
- **Coenzyme Q10** (100 mg TID) — improves mitochondrial energy metabolism
- **Feverfew** — modest evidence for prevention

## Medical Treatment
- **Acute**: triptans, NSAIDs, anti-emetics
- **Preventive**: beta-blockers, anticonvulsants, antidepressants
- **CGRP-targeted therapy**: anti-CGRP monoclonal antibodies for chronic/refractory migraine
`,

  "Migraines|bible_sop": `# Migraines — Bible & Spirit of Prophecy

## Biblical Principles

> *"Come unto me, all ye that labour and are heavy laden, and I will give you rest."*
> — Matthew 11:28 (KJV)

> *"Thou wilt keep him in perfect peace, whose mind is stayed on thee: because he trusteth in thee."*
> — Isaiah 26:3 (KJV)

> *"Cast thy burden upon the LORD, and he shall sustain thee."*
> — Psalm 55:22 (KJV)

Stress and emotional burden are the most commonly reported migraine triggers. The biblical invitation to surrender worry to God has direct therapeutic relevance.

## Spirit of Prophecy Counsels

> *"Brain and nerve power is weakened and broken down by overtaxing the mental organs."*
> — *Counsels on Health*, p. 566

> *"Regularity in eating is of vital importance. There should be a specified time for each meal."*
> — *Ministry of Healing*, p. 303

> *"Nature must have assistance to restore the sufferer to health. Fresh air, cleanliness, a proper diet, rest, and judicious treatment with water — these are within the reach of all."*
> — *Counsels on Health*, p. 139

### Key Principles for Migraine
- **Rest for the brain** — avoid mental overtaxation; regular breaks
- **Regularity** — the migraine brain needs routine: regular meals, regular sleep, regular exercise
- **Temperance** — avoid dietary triggers
- **Water** — both internal (hydration) and external (hydrotherapy) applications
- **Trust in God** — peace of mind reduces the stress trigger
`,

  "Migraines|research_ideas": `# Migraines — Ideas for Potential Research

## Elimination Diet vs. Prophylactic Medication
- **Study**: RCT comparing comprehensive elimination diet vs. topiramate 100mg/day for episodic migraine prevention
- **Hypothesis**: Dietary modification will achieve non-inferior reduction in monthly migraine days with fewer side effects
- **Outcome measures**: Monthly migraine days, MIDAS disability score, side effects, quality of life

## Hydration Protocol
- **Study**: RCT of structured hydration protocol (3L water/day) vs. ad libitum fluid intake in chronic migraineurs
- **Hypothesis**: Systematic hydration will reduce migraine frequency by ≥30%
- **Outcome measures**: Monthly migraine days, attack severity, serum osmolality

## Sleep Regularity Intervention
- **Study**: RCT using wearable-guided sleep regularity intervention vs. sleep hygiene education alone
- **Hypothesis**: Sleep regularity (not just duration) is the critical factor
- **Outcome measures**: Migraine frequency, sleep regularity index, actigraphy data

## Magnesium + Riboflavin Combination
- **Study**: Factorial RCT (magnesium alone, riboflavin alone, combination, placebo)
- **Outcome measures**: ≥50% reduction in monthly migraine days, mitochondrial function biomarkers

## Faith-Based Stress Reduction
- **Study**: RCT comparing faith-based mindfulness program vs. secular MBSR in migraineurs with high perceived stress
- **Hypothesis**: Faith-based approach will show comparable migraine reduction with higher long-term adherence
- **Outcome measures**: Migraine frequency, Perceived Stress Scale, spiritual well-being, adherence at 12 months
`,
};

(async () => {
  const [docs] = await db.query(`
    SELECT d.id, c.name as condition_name, cs."sectionType"
    FROM documents d
    JOIN condition_sections cs ON cs."documentId" = d.id
    JOIN conditions c ON c.id = cs."conditionId"
    WHERE d."deletedAt" IS NULL
  `);

  let updated = 0;
  for (const doc of docs) {
    const key = `${doc.condition_name}|${doc.sectionType}`;
    const text = content[key];
    if (!text) {
      console.log(`MISSING content for: ${key}`);
      continue;
    }
    await db.query(
      `UPDATE documents SET text = :text, "updatedAt" = NOW() WHERE id = :id`,
      { replacements: { text: text.trim() + "\n", id: doc.id } }
    );
    updated++;
  }
  console.log(`Updated ${updated} documents with content.`);
  await db.close();
})();
