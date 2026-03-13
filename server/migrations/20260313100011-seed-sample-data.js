"use strict";

const { v4: uuidv4 } = require("uuid");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      const now = new Date();

      // Get the first team
      const [teams] = await queryInterface.sequelize.query(
        `SELECT id FROM teams LIMIT 1`,
        { transaction }
      );
      if (!teams.length) {
        console.log("No teams found — skipping sample data seed.");
        return;
      }
      const teamId = teams[0].id;

      // Get the first user on the team
      const [users] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE "teamId" = :teamId LIMIT 1`,
        { replacements: { teamId }, transaction }
      );
      if (!users.length) {
        console.log("No users found — skipping sample data seed.");
        return;
      }
      const userId = users[0].id;

      // Get care domains
      const [domains] = await queryInterface.sequelize.query(
        `SELECT id, slug FROM care_domains`,
        { transaction }
      );
      const domainMap = {};
      for (const d of domains) {
        domainMap[d.slug] = d.id;
      }

      // ── Conditions ──────────────────────────────────────────

      const conditions = [
        {
          id: uuidv4(),
          name: "Type 2 Diabetes",
          slug: "type-2-diabetes",
          snomedCode: "44054006",
          icdCode: "E11",
          status: "published",
        },
        {
          id: uuidv4(),
          name: "Hypertension",
          slug: "hypertension",
          snomedCode: "38341003",
          icdCode: "I10",
          status: "published",
        },
        {
          id: uuidv4(),
          name: "Coronary Artery Disease",
          slug: "coronary-artery-disease",
          snomedCode: "53741008",
          icdCode: "I25.10",
          status: "review",
        },
        {
          id: uuidv4(),
          name: "Major Depressive Disorder",
          slug: "major-depressive-disorder",
          snomedCode: "370143000",
          icdCode: "F33",
          status: "review",
        },
        {
          id: uuidv4(),
          name: "Obesity",
          slug: "obesity",
          snomedCode: "414916001",
          icdCode: "E66",
          status: "draft",
        },
        {
          id: uuidv4(),
          name: "Non-Alcoholic Fatty Liver Disease",
          slug: "non-alcoholic-fatty-liver-disease",
          snomedCode: "197321007",
          icdCode: "K76.0",
          status: "draft",
        },
        {
          id: uuidv4(),
          name: "Chronic Kidney Disease",
          slug: "chronic-kidney-disease",
          snomedCode: "709044004",
          icdCode: "N18",
          status: "draft",
        },
        {
          id: uuidv4(),
          name: "Rheumatoid Arthritis",
          slug: "rheumatoid-arthritis",
          snomedCode: "69896004",
          icdCode: "M06.9",
          status: "review",
        },
      ];

      const conditionRows = conditions.map((c) => ({
        ...c,
        overviewDocumentId: null,
        collectionId: null,
        teamId,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }));
      await queryInterface.bulkInsert("conditions", conditionRows, {
        transaction,
      });

      // ── Condition Sections ──────────────────────────────────

      const sectionTypes = [
        { sectionType: "risk_factors", title: "Risk Factors/Causes", sortOrder: 0 },
        { sectionType: "physiology", title: "Relevant Physiology", sortOrder: 1 },
        { sectionType: "complications", title: "Complications", sortOrder: 2 },
        { sectionType: "solutions", title: "Solutions", sortOrder: 3 },
        { sectionType: "bible_sop", title: "Bible & Spirit of Prophecy", sortOrder: 4 },
        { sectionType: "research_ideas", title: "Ideas for Potential Research", sortOrder: 5 },
      ];

      const sectionRows = [];
      for (const condition of conditions) {
        for (const st of sectionTypes) {
          sectionRows.push({
            id: uuidv4(),
            conditionId: condition.id,
            sectionType: st.sectionType,
            careDomainId: null,
            documentId: null,
            title: st.title,
            sortOrder: st.sortOrder,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      await queryInterface.bulkInsert("condition_sections", sectionRows, {
        transaction,
      });

      // ── Interventions ───────────────────────────────────────

      const interventions = [
        { id: uuidv4(), name: "Plant-Based Diet", slug: "plant-based-diet", category: "Nutrition", description: "Whole-food plant-based dietary pattern emphasizing fruits, vegetables, legumes, whole grains, nuts, and seeds while minimizing or eliminating animal products and processed foods." },
        { id: uuidv4(), name: "DASH Diet", slug: "dash-diet", category: "Nutrition", description: "Dietary Approaches to Stop Hypertension — high in fruits, vegetables, whole grains, and low-fat dairy, with reduced saturated fat and sodium." },
        { id: uuidv4(), name: "Mediterranean Diet", slug: "mediterranean-diet", category: "Nutrition", description: "Emphasizes olive oil, fish, whole grains, legumes, fruits, vegetables, and moderate red wine consumption." },
        { id: uuidv4(), name: "Aerobic Exercise Program", slug: "aerobic-exercise-program", category: "Exercise", description: "150 minutes per week of moderate-intensity aerobic activity (brisk walking, cycling, swimming) or 75 minutes of vigorous activity." },
        { id: uuidv4(), name: "Resistance Training", slug: "resistance-training", category: "Exercise", description: "Progressive resistance exercises 2-3 times per week targeting major muscle groups to improve insulin sensitivity and metabolic health." },
        { id: uuidv4(), name: "Hydrotherapy", slug: "hydrotherapy", category: "Water Therapy", description: "Therapeutic use of water including contrast showers, warm baths, and aquatic exercises for pain relief and circulation improvement." },
        { id: uuidv4(), name: "Morning Sunlight Exposure", slug: "morning-sunlight-exposure", category: "Sunlight", description: "15-30 minutes of morning sunlight exposure to optimize circadian rhythm, vitamin D synthesis, and mood regulation." },
        { id: uuidv4(), name: "Alcohol Cessation", slug: "alcohol-cessation", category: "Temperance", description: "Complete abstinence from alcohol to reduce liver stress, improve sleep quality, and support cardiovascular health." },
        { id: uuidv4(), name: "Deep Breathing Exercises", slug: "deep-breathing-exercises", category: "Air", description: "Diaphragmatic breathing, box breathing, and pranayama techniques for stress reduction and parasympathetic activation." },
        { id: uuidv4(), name: "Sleep Hygiene Protocol", slug: "sleep-hygiene-protocol", category: "Rest", description: "7-9 hours of consistent sleep, dark cool environment, no screens 1 hour before bed, regular sleep-wake schedule." },
        { id: uuidv4(), name: "Mindfulness Meditation", slug: "mindfulness-meditation", category: "Mental Health", description: "Daily meditation practice (10-20 minutes) for stress reduction, emotional regulation, and cognitive health." },
        { id: uuidv4(), name: "Cognitive Behavioral Therapy", slug: "cognitive-behavioral-therapy", category: "Mental Health", description: "Structured therapeutic approach to identify and change negative thought patterns contributing to depression and anxiety." },
        { id: uuidv4(), name: "Omega-3 Supplementation", slug: "omega-3-supplementation", category: "Supplements", description: "EPA/DHA supplementation (1-2g daily) from algae-based sources for anti-inflammatory effects and cardiovascular protection." },
        { id: uuidv4(), name: "Vitamin D Supplementation", slug: "vitamin-d-supplementation", category: "Supplements", description: "Vitamin D3 supplementation (1000-4000 IU daily) to maintain optimal serum levels (40-60 ng/mL) for immune and metabolic health." },
        { id: uuidv4(), name: "Metformin", slug: "metformin", category: "Medications", description: "First-line pharmaceutical for type 2 diabetes, improves insulin sensitivity and reduces hepatic glucose production." },
      ];

      const interventionRows = interventions.map((i) => ({
        ...i,
        documentId: null,
        teamId,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }));
      await queryInterface.bulkInsert("interventions", interventionRows, {
        transaction,
      });

      // ── Condition-Intervention Links ────────────────────────

      const ciLinks = [
        // Type 2 Diabetes
        { conditionSlug: "type-2-diabetes", interventionSlug: "plant-based-diet", domainSlug: "nutrition", evidenceLevel: "A" },
        { conditionSlug: "type-2-diabetes", interventionSlug: "aerobic-exercise-program", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "type-2-diabetes", interventionSlug: "resistance-training", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "type-2-diabetes", interventionSlug: "sleep-hygiene-protocol", domainSlug: "rest", evidenceLevel: "B" },
        { conditionSlug: "type-2-diabetes", interventionSlug: "metformin", domainSlug: "medications", evidenceLevel: "A" },
        // Hypertension
        { conditionSlug: "hypertension", interventionSlug: "dash-diet", domainSlug: "nutrition", evidenceLevel: "A" },
        { conditionSlug: "hypertension", interventionSlug: "aerobic-exercise-program", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "hypertension", interventionSlug: "deep-breathing-exercises", domainSlug: "air", evidenceLevel: "B" },
        { conditionSlug: "hypertension", interventionSlug: "mindfulness-meditation", domainSlug: "mental-health", evidenceLevel: "B" },
        // Coronary Artery Disease
        { conditionSlug: "coronary-artery-disease", interventionSlug: "plant-based-diet", domainSlug: "nutrition", evidenceLevel: "A" },
        { conditionSlug: "coronary-artery-disease", interventionSlug: "aerobic-exercise-program", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "coronary-artery-disease", interventionSlug: "omega-3-supplementation", domainSlug: "supplements", evidenceLevel: "B" },
        // Major Depressive Disorder
        { conditionSlug: "major-depressive-disorder", interventionSlug: "aerobic-exercise-program", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "major-depressive-disorder", interventionSlug: "morning-sunlight-exposure", domainSlug: "sunlight", evidenceLevel: "B" },
        { conditionSlug: "major-depressive-disorder", interventionSlug: "cognitive-behavioral-therapy", domainSlug: "mental-health", evidenceLevel: "A" },
        { conditionSlug: "major-depressive-disorder", interventionSlug: "omega-3-supplementation", domainSlug: "supplements", evidenceLevel: "B" },
        // Obesity
        { conditionSlug: "obesity", interventionSlug: "plant-based-diet", domainSlug: "nutrition", evidenceLevel: "A" },
        { conditionSlug: "obesity", interventionSlug: "aerobic-exercise-program", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "obesity", interventionSlug: "resistance-training", domainSlug: "exercise", evidenceLevel: "A" },
        { conditionSlug: "obesity", interventionSlug: "sleep-hygiene-protocol", domainSlug: "rest", evidenceLevel: "B" },
      ];

      const ciRows = [];
      for (const link of ciLinks) {
        const condition = conditions.find((c) => c.slug === link.conditionSlug);
        const intervention = interventions.find((i) => i.slug === link.interventionSlug);
        if (condition && intervention) {
          ciRows.push({
            id: uuidv4(),
            conditionId: condition.id,
            interventionId: intervention.id,
            careDomainId: domainMap[link.domainSlug] || null,
            evidenceLevel: link.evidenceLevel,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      await queryInterface.bulkInsert("condition_interventions", ciRows, {
        transaction,
      });

      // ── Evidence Entries ────────────────────────────────────

      const evidenceEntries = [
        {
          conditionSlug: "type-2-diabetes",
          title: "A plant-based diet for the prevention and treatment of type 2 diabetes",
          pubmedId: "28630614",
          journal: "Journal of Geriatric Cardiology",
          authors: "McMacken M, Shah S",
          publicationDate: new Date("2017-05-01"),
        },
        {
          conditionSlug: "type-2-diabetes",
          title: "Vegetarian diets and incidence of diabetes in the Adventist Health Study-2",
          pubmedId: "23169929",
          journal: "Nutrition, Metabolism & Cardiovascular Diseases",
          authors: "Tonstad S, Stewart K, Oda K, et al.",
          publicationDate: new Date("2013-04-01"),
        },
        {
          conditionSlug: "type-2-diabetes",
          title: "Effects of exercise on glycemic control and body mass in type 2 diabetes mellitus: a meta-analysis",
          pubmedId: "12351431",
          journal: "JAMA",
          authors: "Boule NG, Haddad E, Kenny GP, et al.",
          publicationDate: new Date("2001-09-12"),
        },
        {
          conditionSlug: "hypertension",
          title: "A clinical trial of the effects of dietary patterns on blood pressure (DASH)",
          pubmedId: "9099655",
          journal: "New England Journal of Medicine",
          authors: "Appel LJ, Moore TJ, Obarzanek E, et al.",
          publicationDate: new Date("1997-04-17"),
        },
        {
          conditionSlug: "hypertension",
          title: "Exercise and hypertension: clinical evidence and mechanisms",
          pubmedId: "25377393",
          journal: "Hypertension",
          authors: "Pescatello LS, Franklin BA, Fagard R, et al.",
          publicationDate: new Date("2004-05-01"),
        },
        {
          conditionSlug: "coronary-artery-disease",
          title: "Can lifestyle changes reverse coronary heart disease? The Lifestyle Heart Trial",
          pubmedId: "2136947",
          journal: "The Lancet",
          authors: "Ornish D, Brown SE, Scherwitz LW, et al.",
          publicationDate: new Date("1990-07-21"),
        },
        {
          conditionSlug: "coronary-artery-disease",
          title: "Intensive lifestyle changes for reversal of coronary heart disease — 5-year follow-up",
          pubmedId: "9863851",
          journal: "JAMA",
          authors: "Ornish D, Scherwitz LW, Billings JH, et al.",
          publicationDate: new Date("1998-12-16"),
        },
        {
          conditionSlug: "major-depressive-disorder",
          title: "Exercise for the prevention and treatment of depression: a review of randomized controlled trials",
          pubmedId: "24026850",
          journal: "Journal of Clinical Psychiatry",
          authors: "Rethorst CD, Wipfli BM, Landers DM",
          publicationDate: new Date("2009-01-01"),
        },
        {
          conditionSlug: "major-depressive-disorder",
          title: "Omega-3 fatty acids for the treatment of depression: systematic review and meta-analysis",
          pubmedId: "19499625",
          journal: "Molecular Psychiatry",
          authors: "Sublette ME, Ellis SP, Geant AL, Mann JJ",
          publicationDate: new Date("2011-09-01"),
        },
        {
          conditionSlug: "obesity",
          title: "A multicenter randomized controlled trial of a plant-based nutrition program to reduce body weight",
          pubmedId: "25592014",
          journal: "Journal of General Internal Medicine",
          authors: "Mishra S, Xu J, Agarwal U, et al.",
          publicationDate: new Date("2015-01-01"),
        },
      ];

      const evidenceRows = evidenceEntries.map((e) => {
        const condition = conditions.find((c) => c.slug === e.conditionSlug);
        return {
          id: uuidv4(),
          conditionId: condition ? condition.id : null,
          interventionId: null,
          title: e.title,
          pubmedId: e.pubmedId,
          doi: null,
          authors: e.authors,
          journal: e.journal,
          publicationDate: e.publicationDate,
          abstract: null,
          url: `https://pubmed.ncbi.nlm.nih.gov/${e.pubmedId}/`,
          teamId,
          createdById: userId,
          createdAt: now,
          updatedAt: now,
        };
      });
      await queryInterface.bulkInsert("evidence_entries", evidenceRows, {
        transaction,
      });

      // ── Scriptures ──────────────────────────────────────────

      const scriptures = [
        { conditionSlug: "type-2-diabetes", reference: "Genesis 1:29", text: "And God said, Behold, I have given you every herb bearing seed, which is upon the face of all the earth, and every tree, in the which is the fruit of a tree yielding seed; to you it shall be for meat.", book: "Genesis", chapter: 1, verseStart: 29, verseEnd: null, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "nutrition" },
        { conditionSlug: "type-2-diabetes", reference: "Daniel 1:12-16", text: "Prove thy servants, I beseech thee, ten days; and let them give us pulse to eat, and water to drink. Then let our countenances be looked upon before thee... And at the end of ten days their countenances appeared fairer and fatter in flesh than all the children which did eat the portion of the king\u2019s meat.", book: "Daniel", chapter: 1, verseStart: 12, verseEnd: 16, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "nutrition" },
        { conditionSlug: "type-2-diabetes", reference: "Ministry of Healing, p. 127", text: "In grains, fruits, vegetables, and nuts are to be found all the food elements that we need.", book: null, chapter: null, verseStart: null, verseEnd: null, translation: "SoP", spiritOfProphecy: true, sopSource: "Ministry of Healing", theme: "nutrition" },
        { conditionSlug: "hypertension", reference: "Philippians 4:6-7", text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God. And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.", book: "Philippians", chapter: 4, verseStart: 6, verseEnd: 7, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "trust" },
        { conditionSlug: "major-depressive-disorder", reference: "Psalm 34:18", text: "The LORD is nigh unto them that are of a broken heart; and saveth such as be of a contrite spirit.", book: "Psalms", chapter: 34, verseStart: 18, verseEnd: null, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "mental-health" },
        { conditionSlug: "major-depressive-disorder", reference: "Isaiah 41:10", text: "Fear thou not; for I am with thee: be not dismayed; for I am thy God: I will strengthen thee; yea, I will help thee; yea, I will uphold thee with the right hand of my righteousness.", book: "Isaiah", chapter: 41, verseStart: 10, verseEnd: null, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "trust" },
        { conditionSlug: "coronary-artery-disease", reference: "3 John 1:2", text: "Beloved, I wish above all things that thou mayest prosper and be in health, even as thy soul prospereth.", book: "3 John", chapter: 1, verseStart: 2, verseEnd: null, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "health" },
        { conditionSlug: "obesity", reference: "1 Corinthians 6:19-20", text: "What? know ye not that your body is the temple of the Holy Ghost which is in you, which ye have of God, and ye are not your own? For ye are bought with a price: therefore glorify God in your body, and in your spirit, which are God\u2019s.", book: "1 Corinthians", chapter: 6, verseStart: 19, verseEnd: 20, translation: "KJV", spiritOfProphecy: false, sopSource: null, theme: "temperance" },
        { conditionSlug: "obesity", reference: "Counsels on Diet and Foods, p. 37", text: "Since the laws of nature are the laws of God, it is plainly our duty to give these laws careful study. We should study their requirements in regard to our own bodies, and conform to them.", book: null, chapter: null, verseStart: null, verseEnd: null, translation: "SoP", spiritOfProphecy: true, sopSource: "Counsels on Diet and Foods", theme: "temperance" },
      ];

      const scriptureRows = scriptures.map((s) => {
        const condition = conditions.find((c) => c.slug === s.conditionSlug);
        return {
          id: uuidv4(),
          conditionId: condition ? condition.id : null,
          interventionId: null,
          reference: s.reference,
          text: s.text,
          book: s.book,
          chapter: s.chapter,
          verseStart: s.verseStart,
          verseEnd: s.verseEnd,
          translation: s.translation,
          spiritOfProphecy: s.spiritOfProphecy,
          sopSource: s.sopSource,
          theme: s.theme,
          teamId,
          createdAt: now,
          updatedAt: now,
        };
      });
      await queryInterface.bulkInsert("scriptures", scriptureRows, {
        transaction,
      });

      // ── Recipes ─────────────────────────────────────────────

      const recipes = [
        {
          id: uuidv4(),
          name: "Anti-Inflammatory Turmeric Lentil Soup",
          slug: "turmeric-lentil-soup",
          description: "A warming, protein-rich soup featuring turmeric, lentils, and vegetables. Supports blood sugar regulation and reduces inflammation.",
          servings: 6,
          prepTime: 15,
          cookTime: 35,
          ingredients: JSON.stringify(["1 cup red lentils", "1 tbsp turmeric powder", "1 onion diced", "3 cloves garlic", "2 carrots chopped", "4 cups vegetable broth", "1 can coconut milk", "1 tsp cumin", "Fresh cilantro"]),
          instructions: JSON.stringify(["Saute onion and garlic in olive oil", "Add carrots, turmeric, and cumin", "Add lentils and broth, bring to boil", "Simmer 25 minutes until lentils are tender", "Stir in coconut milk, season to taste", "Garnish with fresh cilantro"]),
          dietaryTags: JSON.stringify(["vegan", "gluten-free", "anti-inflammatory"]),
          nutritionData: JSON.stringify({ calories: 280, protein: 14, fiber: 12, fat: 8 }),
        },
        {
          id: uuidv4(),
          name: "Berry Overnight Oats",
          slug: "berry-overnight-oats",
          description: "High-fiber breakfast rich in antioxidants. Supports cardiovascular health and steady blood sugar levels throughout the morning.",
          servings: 2,
          prepTime: 10,
          cookTime: 0,
          ingredients: JSON.stringify(["1 cup rolled oats", "1 cup plant milk", "1/2 cup mixed berries", "2 tbsp chia seeds", "1 tbsp flaxseed meal", "1 tbsp maple syrup", "1/4 tsp cinnamon"]),
          instructions: JSON.stringify(["Combine oats, plant milk, chia seeds, flaxseed, and cinnamon", "Stir well, cover, and refrigerate overnight", "Top with mixed berries and maple syrup before serving"]),
          dietaryTags: JSON.stringify(["vegan", "high-fiber", "heart-healthy"]),
          nutritionData: JSON.stringify({ calories: 320, protein: 10, fiber: 14, fat: 9 }),
        },
        {
          id: uuidv4(),
          name: "Mediterranean Chickpea Bowl",
          slug: "mediterranean-chickpea-bowl",
          description: "A colorful grain bowl with chickpeas, roasted vegetables, and tahini dressing. Rich in plant protein and heart-healthy fats.",
          servings: 4,
          prepTime: 15,
          cookTime: 25,
          ingredients: JSON.stringify(["2 cans chickpeas", "1 cup quinoa", "1 cucumber diced", "1 cup cherry tomatoes", "1/2 red onion", "1/4 cup kalamata olives", "2 tbsp tahini", "1 lemon juiced", "Fresh parsley"]),
          instructions: JSON.stringify(["Cook quinoa according to package directions", "Roast chickpeas with olive oil and spices at 400F for 20 min", "Combine quinoa, chickpeas, cucumber, tomatoes, onion, olives", "Whisk tahini with lemon juice and water for dressing", "Drizzle dressing and garnish with parsley"]),
          dietaryTags: JSON.stringify(["vegan", "mediterranean", "high-protein"]),
          nutritionData: JSON.stringify({ calories: 420, protein: 18, fiber: 12, fat: 14 }),
        },
        {
          id: uuidv4(),
          name: "Green Smoothie for Blood Pressure",
          slug: "green-smoothie-bp",
          description: "A potassium-rich smoothie with leafy greens, banana, and beets. Specifically formulated to support healthy blood pressure levels.",
          servings: 2,
          prepTime: 5,
          cookTime: 0,
          ingredients: JSON.stringify(["2 cups spinach", "1 banana", "1/2 cup cooked beets", "1 cup almond milk", "1 tbsp flaxseed", "1/2 cup frozen berries"]),
          instructions: JSON.stringify(["Add all ingredients to a blender", "Blend until smooth", "Serve immediately"]),
          dietaryTags: JSON.stringify(["vegan", "gluten-free", "dash-friendly"]),
          nutritionData: JSON.stringify({ calories: 180, protein: 5, fiber: 6, fat: 4 }),
        },
        {
          id: uuidv4(),
          name: "Walnut-Crusted Baked Tofu",
          slug: "walnut-crusted-baked-tofu",
          description: "Omega-3 rich baked tofu with a crispy walnut crust. Supports brain health and provides anti-inflammatory benefits.",
          servings: 4,
          prepTime: 15,
          cookTime: 30,
          ingredients: JSON.stringify(["1 block extra-firm tofu", "1 cup walnuts crushed", "2 tbsp nutritional yeast", "1 tbsp soy sauce", "1 tsp garlic powder", "1 tsp smoked paprika"]),
          instructions: JSON.stringify(["Press tofu and slice into strips", "Mix crushed walnuts, nutritional yeast, garlic powder, paprika", "Brush tofu with soy sauce", "Press walnut mixture onto tofu strips", "Bake at 375F for 30 minutes until golden"]),
          dietaryTags: JSON.stringify(["vegan", "high-protein", "brain-healthy"]),
          nutritionData: JSON.stringify({ calories: 310, protein: 22, fiber: 4, fat: 20 }),
        },
      ];

      const recipeRows = recipes.map((r) => ({
        ...r,
        documentId: null,
        teamId,
        createdById: userId,
        createdAt: now,
        updatedAt: now,
        deletedAt: null,
      }));
      await queryInterface.bulkInsert("recipes", recipeRows, { transaction });

      // ── Condition-Recipe Links ──────────────────────────────

      const crLinks = [
        { conditionSlug: "type-2-diabetes", recipeSlug: "turmeric-lentil-soup", domainSlug: "nutrition" },
        { conditionSlug: "type-2-diabetes", recipeSlug: "berry-overnight-oats", domainSlug: "nutrition" },
        { conditionSlug: "hypertension", recipeSlug: "green-smoothie-bp", domainSlug: "nutrition" },
        { conditionSlug: "hypertension", recipeSlug: "mediterranean-chickpea-bowl", domainSlug: "nutrition" },
        { conditionSlug: "coronary-artery-disease", recipeSlug: "mediterranean-chickpea-bowl", domainSlug: "nutrition" },
        { conditionSlug: "coronary-artery-disease", recipeSlug: "walnut-crusted-baked-tofu", domainSlug: "nutrition" },
        { conditionSlug: "major-depressive-disorder", recipeSlug: "walnut-crusted-baked-tofu", domainSlug: "nutrition" },
        { conditionSlug: "major-depressive-disorder", recipeSlug: "berry-overnight-oats", domainSlug: "nutrition" },
        { conditionSlug: "obesity", recipeSlug: "turmeric-lentil-soup", domainSlug: "nutrition" },
        { conditionSlug: "obesity", recipeSlug: "green-smoothie-bp", domainSlug: "nutrition" },
      ];

      const crRows = [];
      for (const link of crLinks) {
        const condition = conditions.find((c) => c.slug === link.conditionSlug);
        const recipe = recipes.find((r) => r.slug === link.recipeSlug);
        if (condition && recipe) {
          crRows.push({
            id: uuidv4(),
            conditionId: condition.id,
            recipeId: recipe.id,
            careDomainId: domainMap[link.domainSlug] || null,
            sortOrder: 0,
            createdAt: now,
            updatedAt: now,
          });
        }
      }
      await queryInterface.bulkInsert("condition_recipes", crRows, {
        transaction,
      });

      console.log("Sample data seeded successfully:");
      console.log(`  - ${conditions.length} conditions`);
      console.log(`  - ${sectionRows.length} condition sections`);
      console.log(`  - ${interventions.length} interventions`);
      console.log(`  - ${ciRows.length} condition-intervention links`);
      console.log(`  - ${evidenceRows.length} evidence entries`);
      console.log(`  - ${scriptureRows.length} scriptures`);
      console.log(`  - ${recipes.length} recipes`);
      console.log(`  - ${crRows.length} condition-recipe links`);
    });
  },

  async down(queryInterface) {
    return queryInterface.sequelize.transaction(async (transaction) => {
      await queryInterface.bulkDelete("condition_recipes", null, { transaction });
      await queryInterface.bulkDelete("condition_interventions", null, { transaction });
      await queryInterface.bulkDelete("evidence_entries", null, { transaction });
      await queryInterface.bulkDelete("scriptures", null, { transaction });
      await queryInterface.bulkDelete("condition_sections", null, { transaction });
      await queryInterface.bulkDelete("recipes", null, { transaction });
      await queryInterface.bulkDelete("interventions", null, { transaction });
      await queryInterface.bulkDelete("conditions", null, { transaction });
    });
  },
};
