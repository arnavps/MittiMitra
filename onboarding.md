# MittiMitra Onboarding Logic (Voice-First Flow)

## Phase 1: Legal & Identity (The Entry)

### Step 1: Welcome & DPDP Consent
- **AI:** "Namaste! I am MittiMitra. To find you the best profit windows, I need to use your GPS and crop data. Do I have your permission under the DPDP Act 2023 to proceed?"
- **User:** "Yes."
- **Action:** Log voice consent; initialize IndexedDB session.

### Step 2: Crop Identity & Volume
- **AI:** "What crop are we working with today, and what is your estimated yield?"
- **User:** "I have 50 crates of tomatoes."
- **Action:** Extract crop: "Tomato", yield: 50, unit: "crates".

## Phase 2: The Decision Node (Branching)

### Step 2.5: Harvest Status Check
- **AI:** "Are these tomatoes already harvested, or are you still deciding when to start cutting them?"
- **User Option A:** "Not yet harvested." $\rightarrow$ GO TO BRANCH B (ORACLE)
- **User Option B:** "Already harvested." $\rightarrow$ GO TO BRANCH A (LOGISTICS)

### BRANCH A: Already Harvested (Logistics Track)

#### Step A3: Storage Audit
- **AI:** "Where are the crates kept right now? Open field, under a shed, or in cold storage?"
- **User:** "Open field."
- **Action:** Assign high baseline $Q_{10}$ decay rate due to ambient heat.

#### Step A4: The Health Audit (Conditional)
- **AI:** "Do they look healthy, or have you noticed any spots or irregularities?"
- **User:** "There are some black spots."
- **Action:** Trigger Disease Scanner.
- **AI:** "Please show me a close-up via the camera."
- **Action:** Update Pathological Risk Multiplier ($D_m$).

#### Step A5: Convergence
$\rightarrow$ GO TO PHASE 3

### BRANCH B: Not Yet Harvested (Oracle Track)

#### Step B3: Maturity Calculation
- **AI:** "When did you sow the seeds?"
- **User:** "November 15th."
- **Action:** Query IMD API for GDD (Growing Degree Days) to estimate current biological ripeness.

#### Step B4: The Oracle Verdict
- **AI:** "Your crop is at 96% maturity. However, a local supply glut is predicted for Friday, and a heatwave hits Thursday. I recommend harvesting tomorrow morning to secure a 15% price premium."
- **Action:** Create "Pending Harvest" notification; PAUSE FLOW until harvest is confirmed.

#### Step B5: Convergence (Post-Harvest)
- **Action:** Once user harvests, re-trigger Step A3 (Storage Audit) to ensure real-time $Q_{10}$ accuracy.

## Phase 3: Execution & Protection (Convergence)

### Step 6: Transit Configuration
- **AI:** "Will you transport these in a tractor, a pickup truck, or a covered van?"
- **User:** "Open tractor trolley."
- **Action:** Calculate Transit Spoilage Risk based on vehicle exposure.

### Step 7: Departure Audit (Mandatory)
- **AI:** "One last thing—take a 360° photo of the crates as they are loaded. I am locking in your Grade-A Quality Proof."
- **Action:** Generate SHA-256 Hash; store on Immutable Ledger.

### Step 8: The Final Verdict & Co-Pilot
- **AI:** "Based on live Mandi rates, the Vashi market is your best bet today. I've mapped the 'Path of Least Spoilage' for you. Ready to start navigation?"
- **User:** "Yes, let's go."

### Step 9: Success Dashboard (The Aftermath)
**Display Cards:**
- **Shadow Price Certificate:** Verification of verified value.
- **Community Cargo:** Shared truck options nearby.
- **Kisan Sahayata:** Relevant government schemes (e.g., transport subsidies).